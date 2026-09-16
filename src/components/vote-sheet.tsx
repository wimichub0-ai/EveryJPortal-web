"use client";

import Link from "next/link";
import { Check, LoaderCircle, X } from "lucide-react";
import {
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ShareCreatorButton } from "@/components/share-creator-button";
import { VotingStatusBanner } from "@/components/voting-status-banner";
import { CreatorImage } from "@/components/creator-image";
import { YouTubeButton } from "@/components/youtube-button";
import { createClient } from "@/lib/supabase/client";
import type { Creator, VotingStatus } from "@/lib/types";
import { BLOCKED_EMAIL_DOMAINS, VOTE_FLOW_COPY as COPY } from "@/lib/vote-flow-copy";

type VoteStep =
  | "CHECKING"
  | "DETAILS"
  | "CODE"
  | "SUCCESS"
  | "ALREADY_VOTED"
  | "CLOSED"
  | "PAUSED"
  | "EVICTED";

type VoteSheetProps = {
  creator: Creator;
  votingStatus: VotingStatus;
  pausedResumeAt: string | null;
  onClose: () => void;
  onVoteResolved: (creatorId: string, newTotal?: number) => void;
};

const RESEND_SECONDS = 60;
const MAX_SENDS_PER_CONTACT = 5;
const resendDeadlines = new Map<string, number>();
const sendCounts = new Map<string, number>();

function normalizedEmail(value: string) {
  return value.trim().toLowerCase();
}

function emailDomain(value: string) {
  return normalizedEmail(value).split("@")[1] ?? "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail(value));
}

function secondsUntilResend(contact: string) {
  const deadline = resendDeadlines.get(contact) ?? 0;
  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return String(error ?? "");
}

function isRateLimitError(error: unknown) {
  const message = errorMessage(error).toLowerCase();
  const status =
    error && typeof error === "object" && "status" in error ? Number(error.status) : 0;
  return status === 429 || message.includes("rate limit") || message.includes("too many");
}

export function VoteSheet({ creator, votingStatus, pausedResumeAt, onClose, onVoteResolved }: VoteSheetProps) {
  const [step, setStep] = useState<VoteStep>("CHECKING");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [contactError, setContactError] = useState("");
  const [inFlight, setInFlight] = useState(false);
  const [newTotal, setNewTotal] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const requestRef = useRef(false);
  const currentEvicted = useRef(creator.is_evicted);
  useLayoutEffect(() => { currentEvicted.current = creator.is_evicted; }, [creator.is_evicted]);
  const currentStatus = useRef(votingStatus);
  useLayoutEffect(() => { currentStatus.current = votingStatus; }, [votingStatus]);

  const safelyClose = useCallback(() => {
    if (!requestRef.current) onClose();
  }, [onClose]);

  const closeOnEscape = useEffectEvent(() => {
    if (!requestRef.current) onClose();
  });

  const moveToRpcErrorState = useCallback(
    (rpcError: unknown) => {
      const message = errorMessage(rpcError);
      if (message.includes("This creator has been evicted")) {
        currentEvicted.current = true;
        setStep("EVICTED");
        return true;
      }
      if (message.includes("You have already used your vote")) {
        setStep("ALREADY_VOTED");
        onVoteResolved(creator.id);
        return true;
      }
      if (message.includes("Voting is paused")) {
        setStep("PAUSED");
        return true;
      }
      if (message.includes("Voting is closed")) {
        setStep("CLOSED");
        return true;
      }
      if (message.includes("This email domain is not allowed")) {
        setStep("DETAILS");
        setContactError(COPY.blockedEmail);
        return true;
      }
      return false;
    },
    [creator, onVoteResolved],
  );

  const checkEviction = useCallback(async () => {
    if (currentEvicted.current) { setStep("EVICTED"); return false; }
    try {
      const { data, error: creatorError } = await createClient().from("creators")
        .select("is_evicted").eq("id", creator.id).maybeSingle();
      if (creatorError || !data) { setError(COPY.genericError); return false; }
      if (data.is_evicted || currentEvicted.current) {
        currentEvicted.current = true;
        setStep("EVICTED");
        return false;
      }
      return true;
    } catch { setError(COPY.genericError); return false; }
  }, [creator.id]);

  const castVote = useCallback(
    async (voterName: string) => {
      if (currentStatus.current !== "live" || !(await checkEviction())) return false;
      const { data, error: rpcError } = await createClient().rpc("cast_vote", {
        p_creator_id: creator.id,
        p_voter_name: voterName,
      });

      if (rpcError) {
        if (!moveToRpcErrorState(rpcError)) setError(COPY.genericError);
        return false;
      }

      const total = Number(data);
      setNewTotal(total);
      setStep("SUCCESS");
      onVoteResolved(creator.id, total);
      return true;
    },
    [creator, moveToRpcErrorState, onVoteResolved, checkEviction],
  );

  useEffect(() => {
    let cancelled = false;
    if (votingStatus !== "live" || creator.is_evicted) return;

    const checkSession = async () => {
      requestRef.current = true;
      setInFlight(true);
      if (!(await checkEviction())) {
        requestRef.current = false;
        setInFlight(false);
        return;
      }
      if (cancelled || currentEvicted.current) return;
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (cancelled || currentEvicted.current) return;

      if (!data.session) {
        requestRef.current = false;
        setInFlight(false);
        setStep("DETAILS");
        return;
      }

      const { data: existingVote, error: voteLookupError } = await supabase
        .from("votes")
        .select("id")
        .eq("user_id", data.session.user.id)
        .maybeSingle();
      if (cancelled || currentEvicted.current) return;

      if (existingVote) {
        onVoteResolved(creator.id);
        requestRef.current = false;
        setInFlight(false);
        setStep("ALREADY_VOTED");
        return;
      }

      if (voteLookupError) setError(COPY.genericError);
      const { error: signOutError } = await supabase.auth.signOut();
      if (cancelled || currentEvicted.current) return;

      if (signOutError) setError(COPY.genericError);
      requestRef.current = false;
      setInFlight(false);
      setStep("DETAILS");
    };

    void checkSession();
    return () => {
      cancelled = true;
      requestRef.current = false;
    };
  }, [creator.id, creator.is_evicted, onVoteResolved, votingStatus, checkEviction]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") closeOnEscape();
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    const key = normalizedEmail(contact);
    const update = () => setCountdown(key ? secondsUntilResend(key) : 0);
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [creator, contact]);

  const validateDetails = () => {
    setError("");
    setContactError("");
    if (!name.trim()) {
      setError(COPY.requiredName);
      return false;
    }
    if (!isValidEmail(contact)) {
      setContactError(COPY.invalidEmail);
      return null;
    }
    if (BLOCKED_EMAIL_DOMAINS.has(emailDomain(contact))) {
      setContactError(COPY.blockedEmail);
      return null;
    }
    return { normalized: normalizedEmail(contact) };
  };

  const sendCode = async (stayOnCode = false) => {
    if (requestRef.current || votingStatus !== "live" || currentEvicted.current) return;
    const validated = validateDetails();
    if (!validated) return;
    const { normalized } = validated;
    if (secondsUntilResend(normalized) > 0) return;
    if ((sendCounts.get(normalized) ?? 0) >= MAX_SENDS_PER_CONTACT) {
      setError(COPY.sendLimitReached);
      return;
    }

    requestRef.current = true;
    setInFlight(true);
    if (!(await checkEviction())) { requestRef.current = false; setInFlight(false); return; }
    setContact(normalized);
    sendCounts.set(normalized, (sendCounts.get(normalized) ?? 0) + 1);
    const options = { shouldCreateUser: true, data: { full_name: name.trim() } };
    const { error: otpError } = await createClient().auth.signInWithOtp({ email: normalized, options });
    requestRef.current = false;
    setInFlight(false);

    if (otpError) {
      setError(isRateLimitError(otpError) ? COPY.rateLimited : COPY.genericError);
      return;
    }

    resendDeadlines.set(normalized, Date.now() + RESEND_SECONDS * 1000);
    setCountdown(RESEND_SECONDS);
    setDigits(["", "", "", "", "", ""]);
    setError("");
    if (currentEvicted.current) { setStep("EVICTED"); return; }
    if (!stayOnCode) setStep("CODE");
    window.setTimeout(() => inputRefs.current[0]?.focus(), 50);
  };

  const handleDetailsSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendCode();
  };

  const verifyAndVote = async (token = digits.join("")) => {
    if (requestRef.current || votingStatus !== "live" || currentEvicted.current) return;
    if (!/^\d{6}$/.test(token)) {
      setError(COPY.incompleteCode);
      return;
    }

    requestRef.current = true;
    setInFlight(true);
    setError("");
    if (!(await checkEviction())) { requestRef.current = false; setInFlight(false); return; }
    const { error: verifyError } = await createClient().auth.verifyOtp({ email: contact, token, type: "email" });

    if (verifyError) {
      requestRef.current = false;
      setInFlight(false);
      setError(COPY.invalidCode);
      return;
    }

    await castVote(name.trim());
    requestRef.current = false;
    setInFlight(false);
  };

  const updateDigit = (index: number, value: string) => {
    const nextDigit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = nextDigit;
    setDigits(next);
    setError("");
    if (nextDigit && index < 5) inputRefs.current[index + 1]?.focus();
    if (nextDigit && index === 5 && next.every(Boolean)) void verifyAndVote(next.join(""));
  };

  const handleDigitKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    event.preventDefault();
    const next = Array.from({ length: 6 }, (_, index) => pasted[index] ?? "");
    setDigits(next);
    setError("");
    inputRefs.current[Math.min(pasted.length, 6) - 1]?.focus();
    if (pasted.length === 6) void verifyAndVote(pasted);
  };

  const handleCodeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void verifyAndVote();
  };

  const displayStep: VoteStep = creator.is_evicted || step === "EVICTED" ? "EVICTED" : votingStatus === "paused" ? "PAUSED" : votingStatus === "closed" ? "CLOSED" : step;
  const title =
    displayStep === "EVICTED" ? COPY.evictedTitle :
    displayStep === "PAUSED" ? COPY.pausedTitle :
    displayStep === "DETAILS"
      ? COPY.detailsTitle(creator.name)
      : displayStep === "CODE"
        ? COPY.codeTitle
        : displayStep === "SUCCESS"
          ? COPY.successTitle
          : displayStep === "ALREADY_VOTED"
            ? COPY.alreadyTitle
            : displayStep === "CLOSED"
              ? COPY.closedTitle
              : COPY.checking;
  const supportButtons = (
    <div className="space-y-3">
      {creator.youtube_channel_url && <YouTubeButton href={creator.youtube_channel_url} />}
      <ShareCreatorButton creator={creator} variant="vote-sheet" />
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/65 backdrop-blur-[2px] sm:items-center sm:px-4 sm:py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vote-sheet-title"
      onMouseDown={(event) => event.target === event.currentTarget && safelyClose()}
    >
      <div className="animate-sheet-up relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[24px] bg-white px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-5 shadow-2xl sm:rounded-[24px] sm:p-6">
        <button
          ref={closeButtonRef}
          type="button"
          onClick={safelyClose}
          disabled={inFlight}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#F2F2F2] text-[#2B2B2B] transition hover:bg-[#E8E8E8] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={COPY.close}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <header className="flex items-center gap-3 pr-12">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#E8E8E8]">
            <CreatorImage creator={creator} sizes="48px" />
          </div>
          <h2 id="vote-sheet-title" className="font-display text-xl font-bold leading-tight text-[#2B2B2B]">
            {title}
          </h2>
        </header>

        {displayStep === "EVICTED" && (
          <div className="mt-6 space-y-4 text-center">
            <p className="rounded-2xl bg-red-50 px-4 py-5 text-sm leading-6 text-red-800" role="status">{COPY.evictedMessage(creator.name)}</p>
            {creator.youtube_channel_url && <YouTubeButton href={creator.youtube_channel_url} />}
            <Link href="/" onClick={onClose} className="block py-3 text-sm font-semibold text-[#287A1D] underline-offset-4 hover:underline">{COPY.evictedHome}</Link>
          </div>
        )}

        {displayStep === "CHECKING" && (
          <div className="flex min-h-56 items-center justify-center">
            {error ? <p role="alert" className="text-center text-sm text-red-600">{error}</p> : <LoaderCircle className="h-8 w-8 animate-spin text-[#73D75C]" aria-hidden="true" />}
          </div>
        )}

        {displayStep === "DETAILS" && (
          <form onSubmit={handleDetailsSubmit} className="mt-5 space-y-4">
            <p className="text-sm leading-6 text-[#707070]">{COPY.detailsSubtext(creator.name)}</p>
            <label className="block text-sm font-semibold text-[#2B2B2B]">
              {COPY.nameLabel}
              <input
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
                required
                autoComplete="name"
                placeholder={COPY.namePlaceholder}
                className="mt-2 h-12 w-full rounded-xl border border-black/15 bg-white px-4 text-base font-normal outline-none transition focus:border-[#73D75C] focus:ring-3 focus:ring-[#73D75C]/15"
              />
            </label>
            <label className="block text-sm font-semibold text-[#2B2B2B]">
              {COPY.contactLabel}
              <input
                value={contact}
                onChange={(event) => {
                  const nextContact = event.currentTarget.value;
                  setContact(nextContact);
                  if (
                    isValidEmail(nextContact) &&
                    BLOCKED_EMAIL_DOMAINS.has(emailDomain(nextContact))
                  ) {
                    setContactError(COPY.blockedEmail);
                  } else {
                    setContactError("");
                  }
                }}
                required
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder={COPY.contactPlaceholder}
                aria-invalid={Boolean(contactError)}
                className="mt-2 h-12 w-full rounded-xl border border-black/15 bg-white px-4 text-base font-normal outline-none transition focus:border-[#73D75C] focus:ring-3 focus:ring-[#73D75C]/15"
              />
              <span className="mt-2 block text-xs font-normal text-[#777]">{COPY.emailHelper}</span>
              {contactError && <span className="mt-1.5 block text-xs font-normal text-red-600">{contactError}</span>}
            </label>
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <button
              type="submit"
              disabled={inFlight || countdown > 0}
              className="min-h-12 w-full rounded-full bg-[#73D75C] px-5 font-display text-sm font-bold text-[#173512] transition hover:bg-[#60C449] disabled:cursor-not-allowed disabled:bg-[#D8D8D8] disabled:text-[#777]"
            >
              {inFlight ? COPY.sendingCode : countdown > 0 ? COPY.resendIn(countdown) : COPY.sendCode}
            </button>
          </form>
        )}

        {displayStep === "CODE" && (
          <form onSubmit={handleCodeSubmit} className="mt-5">
            <p className="text-sm leading-6 text-[#707070]">
              {COPY.codeSubtext(contact)}
            </p>
            <div className="mt-5 grid grid-cols-6 gap-2" aria-label="6-digit verification code">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => { inputRefs.current[index] = element; }}
                  value={digit}
                  onChange={(event) => updateDigit(index, event.currentTarget.value)}
                  onKeyDown={(event) => handleDigitKeyDown(index, event)}
                  onPaste={handlePaste}
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  pattern="[0-9]*"
                  maxLength={1}
                  aria-label={`Code digit ${index + 1}`}
                  className="aspect-square min-w-0 rounded-xl border border-black/15 text-center font-display text-xl font-bold outline-none transition focus:border-[#73D75C] focus:ring-3 focus:ring-[#73D75C]/15"
                />
              ))}
            </div>
            {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
            <button
              type="submit"
              disabled={inFlight || digits.some((digit) => !digit)}
              className="mt-5 min-h-12 w-full rounded-full bg-[#73D75C] px-5 font-display text-sm font-bold text-[#173512] transition hover:bg-[#60C449] disabled:cursor-not-allowed disabled:bg-[#D8D8D8] disabled:text-[#777]"
            >
              {inFlight ? COPY.verifying : COPY.verifyAndVote}
            </button>
            <div className="mt-4 flex items-center justify-center gap-5 text-xs">
              <button
                type="button"
                disabled={inFlight || countdown > 0}
                onClick={() => void sendCode(true)}
                className="font-semibold text-[#287A1D] underline-offset-4 hover:underline disabled:text-[#999]"
              >
                {countdown > 0 ? COPY.resendIn(countdown) : COPY.resendCode}
              </button>
              <button
                type="button"
                disabled={inFlight}
                onClick={() => {
                  setStep("DETAILS");
                  setDigits(["", "", "", "", "", ""]);
                  setError("");
                }}
                className="font-semibold text-[#5F5F5F] underline-offset-4 hover:underline"
              >
                {COPY.changeContact}
              </button>
            </div>
          </form>
        )}

        {displayStep === "SUCCESS" && (
          <div className="mt-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#E2F7E9] text-[#1A9A4A]">
              <Check className="h-10 w-10 stroke-[3]" aria-hidden="true" />
            </div>
            <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-[#707070]">
              {COPY.successSubtext(creator.name, newTotal)}
            </p>
            <div className="mt-6">{supportButtons}</div>
          </div>
        )}

        {displayStep === "ALREADY_VOTED" && (
          <div className="mt-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E5F8DF] font-display text-2xl font-bold text-[#287A1D]">
              1×
            </div>
            <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-[#707070]">{COPY.alreadySubtext}</p>
            <div className="mt-6">{supportButtons}</div>
          </div>
        )}

        {(displayStep === "PAUSED" || displayStep === "CLOSED") && (
          <div className="mt-6">
            <VotingStatusBanner status={displayStep === "PAUSED" ? "paused" : "closed"} pausedResumeAt={pausedResumeAt} />
            <button type="button" onClick={onClose} className="mt-4 min-h-12 w-full rounded-full bg-[#EEEEEE] px-5 font-display text-sm font-semibold text-[#2B2B2B] disabled:opacity-50">{COPY.gotIt}</button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { Check, ExternalLink, LoaderCircle, X } from "lucide-react";
import {
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { CreatorImage } from "@/components/creator-image";
import { YouTubeButton } from "@/components/youtube-button";
import { createClient } from "@/lib/supabase/client";
import type { Creator } from "@/lib/types";
import { BLOCKED_EMAIL_DOMAINS, VOTE_FLOW_COPY as COPY } from "@/lib/vote-flow-copy";

type VoteStep =
  | "CHECKING"
  | "CONFIRM"
  | "DETAILS"
  | "CODE"
  | "SUCCESS"
  | "ALREADY_VOTED"
  | "CLOSED";

type VoteSheetProps = {
  creator: Creator;
  votingOpen: boolean;
  onClose: () => void;
  onVoteResolved: (creatorId: string, newTotal?: number) => void;
};

const RESEND_SECONDS = 60;
const resendDeadlines = new Map<string, number>();

function normalizedEmail(value: string) {
  return value.trim().toLowerCase();
}

function emailDomain(value: string) {
  return normalizedEmail(value).split("@")[1] ?? "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail(value));
}

function secondsUntilResend(email: string) {
  const deadline = resendDeadlines.get(normalizedEmail(email)) ?? 0;
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

export function VoteSheet({ creator, votingOpen, onClose, onVoteResolved }: VoteSheetProps) {
  const [step, setStep] = useState<VoteStep>(votingOpen ? "CHECKING" : "CLOSED");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [inFlight, setInFlight] = useState(false);
  const [newTotal, setNewTotal] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [copied, setCopied] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const requestRef = useRef(false);

  const safelyClose = useCallback(() => {
    if (!requestRef.current) onClose();
  }, [onClose]);

  const moveToRpcErrorState = useCallback(
    (rpcError: unknown) => {
      const message = errorMessage(rpcError);
      if (message.includes("You have already used your vote")) {
        setStep("ALREADY_VOTED");
        onVoteResolved(creator.id);
        return true;
      }
      if (message.includes("Voting is closed")) {
        setStep("CLOSED");
        return true;
      }
      if (message.includes("This email domain is not allowed")) {
        setStep("DETAILS");
        setEmailError(COPY.blockedEmail);
        return true;
      }
      return false;
    },
    [creator, onVoteResolved],
  );

  const castVote = useCallback(
    async (voterName: string) => {
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
    [creator, moveToRpcErrorState, onVoteResolved],
  );

  useEffect(() => {
    let cancelled = false;
    if (!votingOpen) return;

    const checkSession = async () => {
      requestRef.current = true;
      setInFlight(true);
      const { data } = await createClient().auth.getSession();
      if (cancelled) return;

      if (!data.session) {
        requestRef.current = false;
        setInFlight(false);
        setStep("DETAILS");
        return;
      }

      const user = data.session.user;
      const metadataName = String(
        user.user_metadata.full_name ??
          user.user_metadata.name ??
          user.email?.split("@")[0] ??
          "Voter",
      );
      setName(metadataName);
      setEmail(user.email ?? "");
      requestRef.current = false;
      setInFlight(false);
      setStep("CONFIRM");
    };

    void checkSession();
    return () => {
      cancelled = true;
      requestRef.current = false;
    };
  }, [votingOpen]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") safelyClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [creator, safelyClose]);

  useEffect(() => {
    const update = () => setCountdown(secondsUntilResend(email));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [creator, email]);

  const validateDetails = () => {
    setError("");
    setEmailError("");
    if (!name.trim()) {
      setError(COPY.requiredName);
      return false;
    }
    if (!isValidEmail(email)) {
      setEmailError(COPY.invalidEmail);
      return false;
    }
    if (BLOCKED_EMAIL_DOMAINS.has(emailDomain(email))) {
      setEmailError(COPY.blockedEmail);
      return false;
    }
    return true;
  };

  const sendCode = async (stayOnCode = false) => {
    if (requestRef.current || !validateDetails()) return;
    if (secondsUntilResend(email) > 0) return;

    requestRef.current = true;
    setInFlight(true);
    const cleanEmail = normalizedEmail(email);
    setEmail(cleanEmail);
    const { error: otpError } = await createClient().auth.signInWithOtp({
      email: cleanEmail,
      options: { shouldCreateUser: true, data: { full_name: name.trim() } },
    });
    requestRef.current = false;
    setInFlight(false);

    if (otpError) {
      setError(isRateLimitError(otpError) ? COPY.rateLimited : COPY.genericError);
      return;
    }

    resendDeadlines.set(cleanEmail, Date.now() + RESEND_SECONDS * 1000);
    setCountdown(RESEND_SECONDS);
    setDigits(["", "", "", "", "", ""]);
    setError("");
    if (!stayOnCode) setStep("CODE");
    window.setTimeout(() => inputRefs.current[0]?.focus(), 50);
  };

  const handleDetailsSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendCode();
  };

  const verifyAndVote = async (token = digits.join("")) => {
    if (requestRef.current) return;
    if (!/^\d{6}$/.test(token)) {
      setError(COPY.incompleteCode);
      return;
    }

    requestRef.current = true;
    setInFlight(true);
    setError("");
    const { error: verifyError } = await createClient().auth.verifyOtp({
      email: normalizedEmail(email),
      token,
      type: "email",
    });

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

  const confirmReturningVote = async () => {
    if (requestRef.current) return;
    requestRef.current = true;
    setInFlight(true);
    setError("");
    await castVote(name);
    requestRef.current = false;
    setInFlight(false);
  };

  const shareCreator = async () => {
    const url = `${window.location.origin}/c/${creator.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: COPY.shareTitle(creator.name),
          text: COPY.shareText(creator.name),
          url,
        });
        return;
      } catch (shareError) {
        if (shareError instanceof DOMException && shareError.name === "AbortError") return;
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
  };

  const title =
    step === "DETAILS"
      ? COPY.detailsTitle(creator.name)
      : step === "CODE"
        ? COPY.codeTitle
        : step === "CONFIRM"
          ? COPY.confirmTitle
        : step === "SUCCESS"
          ? COPY.successTitle
          : step === "ALREADY_VOTED"
            ? COPY.alreadyTitle
            : step === "CLOSED"
              ? COPY.closedTitle
              : COPY.checking;

  const supportButtons = (
    <div className="space-y-3">
      {creator.youtube_channel_url && <YouTubeButton href={creator.youtube_channel_url} />}
      <button
        type="button"
        onClick={() => void shareCreator()}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-[#2B2B2B]/25 bg-white px-5 font-display text-sm font-semibold text-[#2B2B2B] transition hover:border-[#2B2B2B] hover:bg-[#FAFAFA] active:scale-[0.99]"
      >
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
        {copied ? COPY.copied : COPY.share(creator.name)}
      </button>
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

        {step === "CHECKING" && (
          <div className="flex min-h-56 items-center justify-center">
            <LoaderCircle className="h-8 w-8 animate-spin text-[#F2A93B]" aria-hidden="true" />
          </div>
        )}

        {step === "CONFIRM" && (
          <div className="mt-6 text-center">
            <p className="mx-auto max-w-xs text-sm leading-6 text-[#707070]">
              {COPY.confirmSubtext(creator.name)}
            </p>
            {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
            <button
              type="button"
              disabled={inFlight}
              onClick={() => void confirmReturningVote()}
              className="mt-6 min-h-12 w-full rounded-full bg-[#F2A93B] px-5 font-display text-sm font-bold text-white transition hover:bg-[#E99C29] disabled:cursor-not-allowed disabled:bg-[#D8D8D8] disabled:text-[#777]"
            >
              {inFlight ? COPY.confirmingVote : COPY.confirmButton(creator.name)}
            </button>
            <button
              type="button"
              disabled={inFlight}
              onClick={safelyClose}
              className="mt-4 text-sm font-semibold text-[#666] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              {COPY.cancel}
            </button>
          </div>
        )}

        {step === "DETAILS" && (
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
                className="mt-2 h-12 w-full rounded-xl border border-black/15 bg-white px-4 text-base font-normal outline-none transition focus:border-[#F2A93B] focus:ring-3 focus:ring-[#F2A93B]/15"
              />
            </label>
            <label className="block text-sm font-semibold text-[#2B2B2B]">
              {COPY.emailLabel}
              <input
                value={email}
                onChange={(event) => {
                  setEmail(event.currentTarget.value);
                  setEmailError("");
                }}
                required
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={COPY.emailPlaceholder}
                aria-invalid={Boolean(emailError)}
                className="mt-2 h-12 w-full rounded-xl border border-black/15 bg-white px-4 text-base font-normal outline-none transition focus:border-[#F2A93B] focus:ring-3 focus:ring-[#F2A93B]/15"
              />
              {emailError && <span className="mt-2 block text-xs font-normal text-red-600">{emailError}</span>}
            </label>
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <button
              type="submit"
              disabled={inFlight || countdown > 0}
              className="min-h-12 w-full rounded-full bg-[#F2A93B] px-5 font-display text-sm font-bold text-white transition hover:bg-[#E99C29] disabled:cursor-not-allowed disabled:bg-[#D8D8D8] disabled:text-[#777]"
            >
              {inFlight ? COPY.sendingCode : countdown > 0 ? COPY.resendIn(countdown) : COPY.sendCode}
            </button>
          </form>
        )}

        {step === "CODE" && (
          <form onSubmit={handleCodeSubmit} className="mt-5">
            <p className="text-sm leading-6 text-[#707070]">{COPY.codeSubtext(email)}</p>
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
                  className="aspect-square min-w-0 rounded-xl border border-black/15 text-center font-display text-xl font-bold outline-none transition focus:border-[#F2A93B] focus:ring-3 focus:ring-[#F2A93B]/15"
                />
              ))}
            </div>
            {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
            <button
              type="submit"
              disabled={inFlight || digits.some((digit) => !digit)}
              className="mt-5 min-h-12 w-full rounded-full bg-[#F2A93B] px-5 font-display text-sm font-bold text-white transition hover:bg-[#E99C29] disabled:cursor-not-allowed disabled:bg-[#D8D8D8] disabled:text-[#777]"
            >
              {inFlight ? COPY.verifying : COPY.verifyAndVote}
            </button>
            <div className="mt-4 flex items-center justify-center gap-5 text-xs">
              <button
                type="button"
                disabled={inFlight || countdown > 0}
                onClick={() => void sendCode(true)}
                className="font-semibold text-[#B87108] underline-offset-4 hover:underline disabled:text-[#999]"
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
                {COPY.changeEmail}
              </button>
            </div>
          </form>
        )}

        {step === "SUCCESS" && (
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

        {step === "ALREADY_VOTED" && (
          <div className="mt-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF3DF] font-display text-2xl font-bold text-[#D98912]">
              1×
            </div>
            <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-[#707070]">{COPY.alreadySubtext}</p>
            <div className="mt-6">{supportButtons}</div>
          </div>
        )}

        {step === "CLOSED" && (
          <div className="mt-6 text-center">
            <p className="mx-auto max-w-xs text-sm leading-6 text-[#707070]">{COPY.closedSubtext}</p>
          </div>
        )}
      </div>
    </div>
  );
}

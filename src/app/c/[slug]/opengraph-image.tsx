import { ImageResponse } from "next/og";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const alt = "Everything Jos House Of Creator voting profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type OgImageProps = {
  params: Promise<{ slug: string }>;
};

type OgCreator = {
  name: string;
  photo_url: string | null;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "EJ";
}

async function fetchCreator(slug: string): Promise<OgCreator | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;

  const url = new URL("/rest/v1/creators", supabaseUrl);
  url.searchParams.set("select", "name,photo_url");
  url.searchParams.set("slug", `eq.${slug}`);
  url.searchParams.set("is_active", "eq.true");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const creators = (await response.json()) as OgCreator[];
  return creators[0] ?? null;
}

async function fetchPhoto(photoUrl: string | null) {
  if (!photoUrl) return null;
  try {
    const response = await fetch(photoUrl, { cache: "no-store" });
    if (!response.ok) return null;
    return await response.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function OpenGraphImage({ params }: OgImageProps) {
  let creator: OgCreator | null = null;
  let photo: ArrayBuffer | null = null;

  try {
    const { slug } = await params;
    creator = await fetchCreator(slug);
    photo = await fetchPhoto(creator?.photo_url ?? null);
  } catch {
    creator = null;
    photo = null;
  }

  const name = creator?.name ?? "Everything Jos Creator";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        padding: "78px 84px",
        background: "#F5F5F5",
        color: "#2B2B2B",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: 410,
          height: 410,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
          borderRadius: 48,
          background: "#E8E8E8",
          boxShadow: "0 20px 55px rgba(43,43,43,0.12)",
        }}
      >
        {photo ? (
          // ImageResponse accepts fetched binary image data directly.
          <img
            src={photo as unknown as string}
            alt=""
            width="410"
            height="410"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: 270,
              height: 270,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 999,
              background: "#F2A93B",
              color: "white",
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: "-0.04em",
            }}
          >
            {initials(name)}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          marginLeft: 70,
          maxWidth: 540,
        }}
      >
        <div style={{ width: 90, height: 8, borderRadius: 99, background: "#F2A93B" }} />
        <div
          style={{
            marginTop: 30,
            fontSize: name.length > 22 ? 62 : 76,
            lineHeight: 0.98,
            fontWeight: 900,
            letterSpacing: "-0.045em",
          }}
        >
          {name}
        </div>
        <div style={{ marginTop: 25, fontSize: 38, fontWeight: 800, color: "#F2A93B" }}>
          House Of Creator
        </div>
        <div style={{ marginTop: 18, fontSize: 27, lineHeight: 1.25, color: "#777777" }}>
          Vote for me on Everything Jos
        </div>
      </div>
    </div>,
    size,
  );
}

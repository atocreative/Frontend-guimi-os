import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoData = await readFile(join(process.cwd(), "public/logo.webp"));
  const logoSrc = `data:image/webp;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#09090b",
          fontFamily: "system-ui, -apple-system, sans-serif",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Subtle grid background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(15,66,242,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,66,242,0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            display: "flex",
          }}
        />

        {/* Blue glow top-left */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: -80,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(15,66,242,0.18) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Top accent bar */}
        <div
          style={{
            width: "100%",
            height: 3,
            background: "linear-gradient(90deg, #0f42f2, #3b82f6, #0f42f2)",
            display: "flex",
          }}
        />

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            padding: "0 80px",
            gap: 64,
            position: "relative",
          }}
        >
          {/* Logo container */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 160,
              height: 160,
              borderRadius: 24,
              background: "linear-gradient(135deg, #18181b, #27272a)",
              border: "1px solid #27272a",
              flexShrink: 0,
              boxShadow: "0 0 40px rgba(15,66,242,0.25)",
            }}
          >
            <img
              src={logoSrc}
              width={120}
              height={120}
              style={{ borderRadius: 12, objectFit: "contain" }}
            />
          </div>

          {/* Text content */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Badge */}
            <div
              style={{
                display: "flex",
                width: "fit-content",
                alignItems: "center",
                gap: 8,
                backgroundColor: "rgba(15,66,242,0.15)",
                border: "1px solid rgba(15,66,242,0.35)",
                color: "#6694ff",
                fontSize: 13,
                fontWeight: 600,
                padding: "5px 14px",
                borderRadius: 100,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "#0f42f2",
                  display: "flex",
                }}
              />
              GuimiCell · Sistema Interno
            </div>

            {/* Title */}
            <div
              style={{
                fontSize: 80,
                fontWeight: 700,
                color: "#fafafa",
                lineHeight: 1,
                letterSpacing: "-3px",
              }}
            >
              Guimi OS
            </div>

            {/* Description */}
            <div
              style={{
                fontSize: 22,
                color: "#71717a",
                lineHeight: 1.5,
                maxWidth: 580,
                fontWeight: 400,
              }}
            >
              Gestão de vendas, tarefas, equipe e operações — tudo em um só lugar.
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: "1px solid #18181b",
            padding: "18px 80px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#3f3f46",
              fontSize: 14,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#16a34a",
                display: "flex",
              }}
            />
            Acesso restrito — uso exclusivo GuimiCell
          </div>
          <div style={{ color: "#3f3f46", fontSize: 14, letterSpacing: "0.02em" }}>
            guimios.guimicell.com.br
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

const FLYER_API_BASE =
  "https://platform.foodhelpline.org/api/resources.pdf";

export type DownloadFlyerResult =
  | { ok: true; filename: string }
  | { ok: false; error: string };

/**
 * Fetches a print-ready PDF flyer for the given location and triggers a
 * browser download. The API returns application/pdf (stream), not JSON.
 */
export async function downloadAreaFlyer(
  lat: number,
  lng: number,
  locationName: string,
  ref: string,
  options?: {
    flyerLang?: "en" | "es";
    sample?: "1" | "2" | "3" | "4";
  }
): Promise<DownloadFlyerResult> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });

  const trimmedName = locationName.trim();
  if (trimmedName) {
    params.set("locationName", trimmedName);
  }

  const trimmedRef = ref.trim();
  if (trimmedRef) {
    params.set("ref", trimmedRef);
  }

  if (options?.flyerLang) {
    params.set("flyerLang", options.flyerLang);
  }

  if (options?.sample) {
    params.set("sample", options.sample);
  }
  const url = `${FLYER_API_BASE}?${params.toString()}`;

  try {
    const res = await fetch(url, { method: "GET" });

    if (!res.ok) {
      // Try to extract a message from the JSON error body if present
      let message: string | null = null;
      try {
        const errJson = await res.clone().json();
        if (errJson && typeof errJson.message === "string") {
          message = errJson.message;
        }
      } catch {
        // ignore JSON parse errors, we'll fall back to generic copy
      }

      if (res.status === 400) {
        return {
          ok: false,
          error:
            message ??
            "Invalid request. Please check the coordinates and try again.",
        };
      }

      if (res.status === 422) {
        return {
          ok: false,
          error:
            message ??
            "This location is currently outside Lemontree's service area (no nearby resources).",
        };
      }

      return {
        ok: false,
        error:
          message ??
          `Could not generate flyer (${res.status}). Please try again later.`,
      };
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/pdf")) {
      return {
        ok: false,
        error: "Server did not return a PDF. Please try again later.",
      };
    }

    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const safeName = locationName.replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "flyer";
    const filename = `${safeName}-flyer.pdf`;

    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);

    return { ok: true, filename };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network or unknown error";
    return {
      ok: false,
      error: `Failed to download flyer: ${message}`,
    };
  }
}

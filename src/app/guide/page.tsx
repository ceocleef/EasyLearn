import type { Metadata } from "next";
import Guide from "@/components/Guide";
import uk from "@/i18n/uk";

export const metadata: Metadata = {
  title: uk.guide.metaTitle,
  description: uk.guide.intro,
  // Инструкция — для клиентов внутри сервиса, поисковикам её не показываем
  robots: { index: false, follow: false },
};

export default function GuidePage() {
  return <Guide />;
}

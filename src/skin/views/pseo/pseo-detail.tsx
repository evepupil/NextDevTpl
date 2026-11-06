import type { PseoDetailViewProps } from "@/features/pseo/view";

import {
  PseoCta,
  PseoFaq,
  PseoFeatureGrid,
  PseoHero,
  PseoRelated,
  PseoUseCases,
} from "./components";

export function PseoDetailView({ page, relatedPages }: PseoDetailViewProps) {
  return (
    <>
      <PseoHero page={page} />
      <PseoFeatureGrid page={page} />
      <PseoUseCases page={page} />
      <PseoFaq page={page} />
      <PseoRelated
        pages={relatedPages}
        title={page.data.sections.related.title}
        subtitle={page.data.sections.related.subtitle}
      />
      <PseoCta page={page} />
    </>
  );
}

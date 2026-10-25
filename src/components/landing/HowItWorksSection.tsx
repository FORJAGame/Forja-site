import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup'
import { Card } from '@/components/ui/Card'
import { Section } from '@/components/ui/Section'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { landingCopy } from '@/content/landing'

export function HowItWorksSection() {
  const { howItWorks } = landingCopy

  return (
    <Section id="como-funciona" labelledBy="como-funciona-title">
      <SectionHeader id="como-funciona-title" number="02" eyebrow={howItWorks.eyebrow} title={howItWorks.title} />
      <RevealGroup as="ol" label="Etapas" className="grid gap-md md:grid-cols-3 md:gap-lg">
        {howItWorks.steps.map((step, index) => (
          <RevealItem as="li" key={step.title}>
            <Card className="h-full">
              <div className="flex flex-col gap-md p-xl">
                <span aria-hidden="true" className="type-headline-lg text-primary">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="type-headline-md">{step.title}</h3>
                <p className="type-body-md text-on-surface-variant">{step.text}</p>
                {'note' in step && <p className="type-label-mono-sm text-primary-text">{step.note}</p>}
              </div>
            </Card>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  )
}

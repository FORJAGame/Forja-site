import { ButtonLink } from '@/components/ui/ButtonLink'
import { Container } from '@/components/ui/Container'
import { PageHeader } from '@/components/ui/PageHeader'

export default function NotFound() {
  return (
    <>
      <PageHeader
        eyebrow="404"
        title={'Página não\nencontrada.'}
        description="O endereço pode ter mudado ou o conteúdo ainda não foi publicado."
      />
      <Container className="pb-section-mobile md:pb-section">
        <ButtonLink href="/">Voltar ao início</ButtonLink>
      </Container>
    </>
  )
}

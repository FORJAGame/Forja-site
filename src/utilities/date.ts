const monthYear = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })

export const formatMonthYear = (iso: string): string => monthYear.format(new Date(iso))

"use client"

import { TemplateBusiness } from "./template-business"
import { TemplateHero } from "./template-hero"
import { TemplateMinimal } from "./template-minimal"
import { TemplateModern } from "./template-modern"

interface TemplateRendererProps {
  template: string
  title: string
  excerpt?: string | null
  content: string
  organizationName?: string
}

export function TemplateRenderer({ template, title, excerpt, content, organizationName }: TemplateRendererProps) {
  switch (template) {
    case "hero":
      return <TemplateHero title={title} excerpt={excerpt} content={content} organizationName={organizationName} />
    
    case "modern":
      return <TemplateModern title={title} excerpt={excerpt} content={content} organizationName={organizationName} />
    
    case "business":
      return <TemplateBusiness title={title} excerpt={excerpt} content={content} organizationName={organizationName} />
    
    case "minimal":
    default:
      return <TemplateMinimal title={title} excerpt={excerpt} content={content} organizationName={organizationName} />
  }
}

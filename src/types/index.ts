/**
 * Shared TypeScript types and interfaces
 */

export interface NavItem {
  href: string;
  label: string;
  isPrimary?: boolean;
}

export interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
  canonicalUrl?: URL;
}

export interface FormFieldProps {
  id: string;
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'textarea';
  required?: boolean;
  autocomplete?: string;
  helpText?: string;
  rows?: number;
  placeholder?: string;
}



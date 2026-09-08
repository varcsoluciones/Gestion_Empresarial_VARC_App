import { useERP } from '../context/ERPContext';
import { getTranslation } from './translations';

export function useTranslation() {
  const { settings } = useERP();
  const lang = settings.idioma || 'es';
  const t = getTranslation(lang);

  return { t, lang };
}

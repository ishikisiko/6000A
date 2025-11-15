import { useLanguage } from '@/contexts/LanguageContext';

export default function Settings() {
  const { t } = useLanguage();

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold">{t('pages.settings')}</h1>
    </div>
  );
}

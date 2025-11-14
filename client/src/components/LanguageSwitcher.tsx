import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      title={language === 'zh' ? 'Switch to English' : '切换到中文'}
    >
      <Languages className="h-5 w-5" />
      <span className="ml-2 text-sm">{language === 'zh' ? 'EN' : '中'}</span>
    </Button>
  );
}

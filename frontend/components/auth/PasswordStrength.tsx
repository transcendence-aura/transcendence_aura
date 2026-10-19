import { useTranslations } from 'next-intl';

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const t = useTranslations('PasswordStrength');

  const getStrength = (pwd: string): number => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = password ? getStrength(password) : 0;

  const getLabel = () => {
    if (!password) return '';
    if (strength <= 2) return t('weak');
    if (strength === 3) return t('moderate');
    return t('strong');
  };

  const getColorClass = (index: number): string => {
    if (index >= strength) return 'bg-border-default';
    if (strength <= 2) return 'bg-brand-accent';
    if (strength === 3) return 'bg-brand-accent';
    return 'bg-status-online';
  };

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-0.5 flex-1 rounded-sm transition-colors ${getColorClass(i)}`}
          />
        ))}
      </div>
      {password && (
        <p
          className={`mt-1 text-ui-label ${strength >= 4 ? 'text-status-online' : 'text-text-muted'}`}
        >
          {getLabel()}
        </p>
      )}
    </div>
  );
}

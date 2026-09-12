interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
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
    if (strength <= 2) return 'Weak password';
    if (strength === 3) return 'Moderate password';
    return 'Strong password';
  };

  const getColorClass = (index: number): string => {
    if (index >= strength) return 'bg-border-default';
    if (strength <= 2) return 'bg-brand-accent';
    if (strength === 3) return 'bg-[#c8b89a]';
    return 'bg-[#7a9e8e]';
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
        <p className={`mt-1 text-xs ${strength >= 4 ? 'text-[#7a9e8e]' : 'text-text-muted'}`}>
          {getLabel()}
        </p>
      )}
    </div>
  );
}

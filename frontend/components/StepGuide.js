'use client';

export default function StepGuide({ steps }) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={index} className="flex gap-4">
          {/* Step number */}
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-green/20
            border border-brand-green/40 flex items-center justify-center">
            <span className="text-brand-green text-xs font-bold">{index + 1}</span>
          </div>

          {/* Step content */}
          <div className="flex-1 pb-4 border-b border-brand-border last:border-0">
            <h4 className="text-brand-white text-sm font-medium mb-1">
              {step.title}
            </h4>
            <p className="text-brand-textMuted text-sm leading-relaxed">
              {step.description}
            </p>
            {step.code && (
              <div className="mt-2 bg-brand-medGray border border-brand-border
                rounded-lg px-3 py-2">
                <code className="text-brand-green text-xs font-mono">{step.code}</code>
              </div>
            )}
            {step.image && (
              <div className="mt-2 bg-brand-medGray border border-brand-border
                rounded-lg px-3 py-2">
                <p className="text-brand-textMuted text-xs italic">{step.image}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
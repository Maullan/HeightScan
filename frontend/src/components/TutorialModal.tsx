interface TutorialModalProps {
  onClose:     () => void;
  onUnderstand: () => void;
}

const steps = [
  {
    icon: '📍',
    title: 'Find the Sensor',
    desc: 'Look for the ultrasonic sensor mounted above — it will be pointed downward.',
  },
  {
    icon: '🧍',
    title: 'Stand Below It',
    desc: 'Position yourself directly underneath the sensor. Keep feet flat on the ground.',
  },
  {
    icon: '⬆️',
    title: 'Stand Tall & Still',
    desc: 'Straighten your posture. Look forward, not up. Stay still during the scan.',
  },
  {
    icon: '⏱️',
    title: 'Wait for Result',
    desc: 'The scan takes about 2 seconds. Your height will appear instantly on screen.',
  },
];

export default function TutorialModal({ onClose, onUnderstand }: TutorialModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
      id="tutorial-modal"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative glass-card w-full max-w-md p-6 sm:p-8 animate-slide-up">
        {/* Close button */}
        <button
          id="tutorial-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all"
          aria-label="Close tutorial"
        >
          ✕
        </button>

        {/* Title */}
        <div className="mb-6">
          <h2 id="tutorial-title" className="text-2xl font-display font-bold text-gradient mb-1">
            How It Works
          </h2>
          <p className="text-white/40 text-sm">Follow these steps for an accurate measurement</p>
        </div>

        {/* Steps */}
        <ol className="space-y-4 mb-8">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl glass-card flex items-center justify-center text-xl flex-shrink-0">
                {step.icon}
              </div>
              <div>
                <h3 className="font-semibold text-white/90 text-sm mb-0.5">{step.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* CTA */}
        <button
          id="understand-button"
          onClick={onUnderstand}
          className="btn-primary w-full text-base"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            I Understand — Start Scan
          </span>
        </button>
      </div>
    </div>
  );
}

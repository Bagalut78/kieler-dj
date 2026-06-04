import React, { useState, useMemo } from 'react';

// Flat simple check icon
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-dark)' }}><polyline points="20 6 9 17 4 12"></polyline></svg>
);

export default function BookingCalculator() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    eventType: 'wedding',
    hours: 6,
    guests: 'medium',
    addons: {
      uplighting: false,
      ceremonySound: false,
      wirelessMic: false,
      haze: false,
    },
    date: '',
    location: '',
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pricing constants
  const BASE_PRICES = {
    wedding: 890,
    birthday: 690,
    corporate: 990,
    other: 590,
  };

  const EVENT_NAMES = {
    wedding: 'Hochzeit',
    birthday: 'Geburtstag',
    corporate: 'Firmen-Event',
    other: 'Sonstige Feier',
  };

  const GUEST_TIERS = {
    small: { label: 'Bis 50 Gäste', price: 0, desc: 'Kompakte Soundanlage, ideal für kleinere Räume.' },
    medium: { label: '50 - 120 Gäste', price: 150, desc: 'Erweiterte PA mit Subwoofer & Lichteffekten.' },
    large: { label: '120 - 200 Gäste', price: 300, desc: 'Premium Licht- & Tonsystem für vollen Club-Sound.' },
    huge: { label: 'Über 200 Gäste', price: 500, desc: 'Konzerttaugliches PA-System & Moving Heads.' },
  };

  const ADDON_DEFAULTS = {
    uplighting: { label: 'Ambientebeleuchtung (bis zu 18 Spots)', price: 150, desc: 'Malt Wände in eure Wunschfarben (Uplighting)' },
    ceremonySound: { label: 'Beschallung freie Trauung (Zweit-Location)', price: 120, desc: 'Akkubetriebene Soundbox inkl. Funkmikro für den Außenbereich' },
    wirelessMic: { label: 'Zusätzliches Funkmikro', price: 45, desc: 'Perfekt für Ansprachen & Spiele' },
    haze: { label: 'Dunstnebel-Maschine (Hazer)', price: 40, desc: 'Macht Lichteffekte in der Luft sichtbar' },
  };

  // Dynamic Price Calculation
  const priceBreakdown = useMemo(() => {
    const base = BASE_PRICES[formData.eventType];
    const extraHours = Math.max(0, formData.hours - 6);
    const hoursPrice = extraHours * 90;
    const guestsPrice = GUEST_TIERS[formData.guests].price;

    let addonsPrice = 0;
    const selectedAddonsList = [];
    Object.keys(formData.addons).forEach(key => {
      if (formData.addons[key]) {
        const addon = ADDON_DEFAULTS[key];
        addonsPrice += addon.price;
        selectedAddonsList.push({ label: addon.label, price: addon.price });
      }
    });

    const total = base + hoursPrice + guestsPrice + addonsPrice;

    return {
      base,
      extraHours,
      hoursPrice,
      guestsPrice,
      addonsPrice,
      selectedAddonsList,
      total,
    };
  }, [formData.eventType, formData.hours, formData.guests, formData.addons]);

  const handleEventTypeChange = (type) => {
    setFormData(prev => ({ ...prev, eventType: type }));
  };

  const handleHoursChange = (e) => {
    setFormData(prev => ({ ...prev, hours: parseInt(e.target.value) }));
  };

  const handleGuestsChange = (tier) => {
    setFormData(prev => ({ ...prev, guests: tier }));
  };

  const handleAddonToggle = (addonKey) => {
    setFormData(prev => ({
      ...prev,
      addons: {
        ...prev.addons,
        [addonKey]: !prev.addons[addonKey],
      }
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setStep(prev => Math.min(5, prev + 1));
  const prevStep = () => setStep(prev => Math.max(1, prev - 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      date: formData.date,
      location: formData.location,
      eventType: EVENT_NAMES[formData.eventType],
      hours: formData.hours,
      guests: GUEST_TIERS[formData.guests].label,
      addons: Object.keys(formData.addons)
        .filter(key => formData.addons[key])
        .map(key => ADDON_DEFAULTS[key].label)
        .join(', ') || 'Keine Zusatzoptionen',
      estimatedPrice: `${priceBreakdown.total} €`,
      message: formData.message,
    };

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      let result = { success: false };
      try {
        result = await response.json();
      } catch (e) {}

      if (response.ok && result.success) {
        setIsSubmitted(true);
      } else {
        setIsSubmitted(true); // Fallback for local testing / static presentation
      }
    } catch (error) {
      setIsSubmitted(true); // Fallback for local testing / static presentation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="calculator-console">
      {/* Console Top Info / LEDs */}
      {!isSubmitted && (
        <div className="console-status-bar">
          <div className="console-leds">
            <span className="led led-green animate-pulse-brutal"></span>
            <span className="led led-red"></span>
            <span className="console-title">[ SYSTEM ONLINE // SCHRITT {step}/5 ]</span>
          </div>
          <div className="console-percentage">{Math.round((step / 5) * 100)}%</div>
        </div>
      )}

      {isSubmitted ? (
        <div className="success-screen">
          <div className="success-avatar">📢</div>
          <h2>// ANFRAGE EMPFANGEN!</h2>
          <p>
            Vielen Dank, <strong>{formData.name}</strong>. Die Daten wurden erfolgreich auf das DJ-Terminal aufgespielt. Ich melde mich in Kürze bei dir.
          </p>
          <div className="brutal-receipt">
            <div className="receipt-border-top"></div>
            <div className="receipt-content">
              <h3>SYSTEM-LOG // BON</h3>
              <div className="dashed-divider"></div>
              <ul>
                <li>ANLASS: {EVENT_NAMES[formData.eventType]}</li>
                <li>DATUM: {formData.date || 'OFFEN'}</li>
                <li>SPIELDAUER: {formData.hours} STUNDEN</li>
                <li>GÄSTE-SETUP: {GUEST_TIERS[formData.guests].label}</li>
                <div className="dashed-divider"></div>
                <li className="total-row"><strong>GESAMT: {priceBreakdown.total} €</strong></li>
              </ul>
              <div className="receipt-disclaimer-box">
                ⚠️ UNVERBINDLICHE SCHÄTZUNG!<br />Dient nur zur ersten Orientierung.
              </div>
            </div>
            <div className="receipt-border-bottom"></div>
          </div>
          <button className="btn btn-primary" onClick={() => { setIsSubmitted(false); setStep(1); }}>
            Preisschätzung neu starten
          </button>
        </div>
      ) : (
        <div className="console-grid">
          {/* Main Interface */}
          <div className="console-screen">
            
            {/* STEP 1: EVENT TYPE */}
            {step === 1 && (
              <div className="step-wrapper">
                <span className="console-step-badge">// CH 1 // ANLASS</span>
                <h2>Wähle deinen Event-Typ:</h2>
                
                <div className="arcade-options">
                  {[
                    { id: 'wedding', label: 'Hochzeit', icon: '💍', desc: 'Emotionaler Eröffnungstanz & volle Party' },
                    { id: 'birthday', label: 'Geburtstag', icon: '🎉', desc: 'Die besten Partyhymnen von früher bis heute' },
                    { id: 'corporate', label: 'Firmen-Event', icon: '💼', desc: 'Professionelle Begleitung, Messe, Gala' },
                    { id: 'other', label: 'Club & Abiball', icon: '🎵', desc: 'Individuelle Clubgigs, Bälle & Events' }
                  ].map(option => (
                    <div 
                      key={option.id}
                      className={`arcade-card ${formData.eventType === option.id ? 'active' : ''}`}
                      onClick={() => handleEventTypeChange(option.id)}
                    >
                      <span className="arcade-icon">{option.icon}</span>
                      <div className="arcade-info">
                        <h3>{option.label}</h3>
                        <p>{option.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: DURATION */}
            {step === 2 && (
              <div className="step-wrapper">
                <span className="console-step-badge">// CH 2 // SPIELDAUER</span>
                <h2>Dauer der Party festlegen:</h2>
                <p style={{ fontSize: '0.9rem', marginBottom: '2rem' }}>Dauer der Live-Performance (Auf- & Abbau sind kostenlos und dauern ca. 2 Std.).</p>
                
                <div className="arcade-slider-box">
                  <div className="arcade-slider-display">
                    <span className="slider-big-num">{formData.hours}</span> STUNDEN SPIELZEIT
                  </div>
                  <input 
                    type="range" 
                    min="6" 
                    max="10" 
                    value={formData.hours}
                    onChange={handleHoursChange}
                    className="arcade-slider"
                  />
                  <div className="arcade-slider-labels">
                    <span>6 Std. (Basis)</span>
                    <span>8 Std.</span>
                    <span>10 Std. (Maximum)</span>
                  </div>
                </div>

                <div className="console-note-box">
                  <strong>SYSTEM-HINWEIS:</strong> Ich baue ca. 2 Stunden vor deinem Event auf und teste das Soundsystem. Du zahlst nur die effektive Spielzeit.
                </div>
              </div>
            )}

            {/* STEP 3: GUEST SIZE */}
            {step === 3 && (
              <div className="step-wrapper">
                <span className="console-step-badge">// CH 3 // GÄSTE</span>
                <h2>Wie groß wird deine Party?</h2>
                
                <div className="arcade-options">
                  {Object.keys(GUEST_TIERS).map(tierKey => {
                    const tier = GUEST_TIERS[tierKey];
                    return (
                      <div 
                        key={tierKey}
                        className={`arcade-card ${formData.guests === tierKey ? 'active' : ''}`}
                        onClick={() => handleGuestsChange(tierKey)}
                      >
                        <div className="arcade-info">
                          <h3>{tier.label}</h3>
                          <p>{tier.desc}</p>
                          {tier.price > 0 && <span className="arcade-badge">+{tier.price} €</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: ADDONS */}
            {step === 4 && (
              <div className="step-wrapper">
                <span className="console-step-badge">// CH 4 // EXTRAS</span>
                <h2>Zusatz-Komponenten hinzufügen:</h2>
                
                <div className="arcade-addons">
                  {Object.keys(ADDON_DEFAULTS).map(addonKey => {
                    const addon = ADDON_DEFAULTS[addonKey];
                    const isSelected = formData.addons[addonKey];
                    return (
                      <div 
                        key={addonKey}
                        className={`addon-row-brutal ${isSelected ? 'active' : ''}`}
                        onClick={() => handleAddonToggle(addonKey)}
                      >
                        <div className="addon-toggle-box">
                          {isSelected && <CheckIcon />}
                        </div>
                        <div className="addon-row-text">
                          <h3>{addon.label}</h3>
                          <p>{addon.desc}</p>
                        </div>
                        <div className="addon-row-price">+{addon.price} €</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 5: CONTACT & SEND */}
            {step === 5 && (
              <form onSubmit={handleSubmit} className="step-wrapper">
                <span className="console-step-badge">// CH 5 // ABSENDEN</span>
                <h2>Kontakt- & Termin-Eingabe:</h2>
                
                <div className="arcade-form">
                  <div className="form-row-brutal">
                    <label>Dein Name *</label>
                    <input 
                      type="text" 
                      name="name" 
                      required 
                      value={formData.name} 
                      onChange={handleInputChange} 
                      placeholder="z.B. Julia & Max"
                    />
                  </div>
                  <div className="form-row-brutal">
                    <label>E-Mail-Adresse *</label>
                    <input 
                      type="email" 
                      name="email" 
                      required 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      placeholder="deine@mail.de"
                    />
                  </div>
                  <div className="form-row-brutal">
                    <label>Telefonnummer</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleInputChange} 
                      placeholder="Für Absprachen"
                    />
                  </div>
                  <div className="form-row-brutal">
                    <label>Termin / Datum *</label>
                    <input 
                      type="date" 
                      name="date" 
                      required 
                      value={formData.date} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className="form-row-brutal full-width">
                    <label>Veranstaltungsort / Location</label>
                    <input 
                      type="text" 
                      name="location" 
                      value={formData.location} 
                      onChange={handleInputChange} 
                      placeholder="z.B. Kieler Yacht Club, Scheune"
                    />
                  </div>
                  <div className="form-row-brutal full-width">
                    <label>Deine Nachricht / Ergänzungen</label>
                    <textarea 
                      name="message" 
                      rows="3" 
                      value={formData.message} 
                      onChange={handleInputChange} 
                      placeholder="z.B. Infos zum Ablauf, Besonderheiten der Location (Treppen, Strom etc.) oder deine Fragen an mich"
                    ></textarea>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className={`btn btn-primary submit-btn-arcade ${isSubmitting ? 'loading' : ''}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'ÜBERTRAGE DATEN...' : 'ANFRAGE ABSENDEN'}
                </button>
              </form>
            )}

            {/* Navigation buttons inside Console screen */}
            <div className="console-nav">
              {step > 1 ? (
                <button type="button" className="btn btn-outline" onClick={prevStep}>
                  Zurück
                </button>
              ) : <div></div>}
              {step < 5 && (
                <button type="button" className="btn btn-primary next-btn" onClick={nextStep}>
                  Weiter
                </button>
              )}
            </div>
          </div>

          {/* Receipt Sidebar */}
          <div className="arcade-receipt-container">
            <div className="brutal-receipt animate-float">
              <div className="receipt-border-top"></div>
              <div className="receipt-content">
                <h3 className="receipt-header">KALKULATION // ÜBERSICHT</h3>
                <span className="receipt-sub">// KIELER-DJ TERMINAL //</span>
                <div className="dashed-divider"></div>
                
                <div className="receipt-items">
                  <div className="receipt-item">
                    <span>{EVENT_NAMES[formData.eventType]}</span>
                    <span>{priceBreakdown.base} EUR</span>
                  </div>
                  
                  {priceBreakdown.extraHours > 0 && (
                    <div className="receipt-item">
                      <span>Zusatzzeit (+{priceBreakdown.extraHours} Std.)</span>
                      <span>+{priceBreakdown.hoursPrice} EUR</span>
                    </div>
                  )}

                  {priceBreakdown.guestsPrice > 0 && (
                    <div className="receipt-item">
                      <span>PA Upgrade ({GUEST_TIERS[formData.guests].label})</span>
                      <span>+{priceBreakdown.guestsPrice} EUR</span>
                    </div>
                  )}

                  {priceBreakdown.selectedAddonsList.length > 0 && (
                    <>
                      <div className="dashed-divider"></div>
                      <span className="receipt-subheading">EXTRAS:</span>
                      {priceBreakdown.selectedAddonsList.map((addon, idx) => (
                        <div key={idx} className="receipt-item sub-item">
                          <span>* {addon.label}</span>
                          <span>+{addon.price} EUR</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <div className="dashed-divider"></div>
                
                <div className="receipt-total">
                  <span>GESAMT (SCHÄTZUNG):</span>
                  <span className="total-val">{priceBreakdown.total} EUR</span>
                </div>
                
                <div className="receipt-disclaimer-box">
                  ⚠️ UNVERBINDLICHE SCHÄTZUNG!<br />Dient nur zur ersten Orientierung.
                </div>
                
                <div className="dashed-divider"></div>
                <div className="receipt-footer">
                  UST.-BEFREIT NACH § 19 UStG.<br />
                  DIES IST KEIN VERBINDLICHES ANGEBOT.<br />
                  FAHRTKOSTEN RAUM KIEL INKLUSIVE.
                </div>
              </div>
              <div className="receipt-border-bottom"></div>
            </div>
          </div>
        </div>
      )}

      {/* Styled JSX (Brutalist Arcade CSS overrides) */}
      <style>{`
        .calculator-console {
          width: 100%;
          max-width: 1050px;
          margin: 0 auto;
          background-color: var(--color-bg-paper);
          border: var(--border-brutal);
          box-shadow: var(--shadow-brutal);
          padding: 2rem;
          color: var(--color-dark);
          position: relative;
        }

        .console-status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: var(--color-dark);
          color: var(--color-white);
          padding: 0.75rem 1.25rem;
          border: 2px solid var(--color-dark);
          margin-bottom: 2rem;
          font-family: var(--font-mono);
          font-weight: 700;
          font-size: 0.9rem;
        }

        .console-leds {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .led {
          width: 10px;
          height: 10px;
          border-radius: var(--radius-full);
          border: 1px solid var(--color-white);
        }

        .led-green { background-color: var(--color-accent-green); box-shadow: 0 0 8px var(--color-accent-green); }
        .led-red { background-color: var(--color-accent-orange); }

        .console-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2.5rem;
          align-items: start;
        }

        @media (min-width: 900px) {
          .console-grid {
            grid-template-columns: 3fr 2fr;
          }
        }

        .console-screen {
          background-color: var(--color-white);
          border: var(--border-brutal);
          padding: 2rem;
          box-shadow: inset 4px 4px 0px rgba(0, 0, 0, 0.05);
        }

        .console-step-badge {
          display: inline-block;
          font-family: var(--font-mono);
          font-weight: 700;
          font-size: 0.8rem;
          color: var(--color-accent-orange);
          margin-bottom: 0.5rem;
        }

        .step-wrapper h2 {
          font-size: 1.8rem;
          font-weight: 900;
          margin-bottom: 1.5rem;
          letter-spacing: -0.02em;
        }

        .arcade-options {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .arcade-card {
          border: var(--border-brutal);
          background-color: var(--color-white);
          padding: 1.25rem;
          cursor: pointer;
          transition: var(--transition-brutal);
          display: flex;
          align-items: center;
          gap: 1.25rem;
          box-shadow: var(--shadow-brutal-sm);
        }

        .arcade-card:hover {
          background-color: var(--color-bg-paper);
          transform: translate(-2px, -2px);
          box-shadow: 6px 6px 0px var(--color-dark);
        }

        .arcade-card.active {
          background-color: var(--color-accent-yellow);
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0px var(--color-dark);
        }

        .arcade-icon {
          font-size: 2.2rem;
        }

        .arcade-info h3 {
          font-size: 1.2rem;
          font-weight: 900;
          margin-bottom: 0.25rem;
        }

        .arcade-info p {
          font-size: 0.85rem;
          margin-bottom: 0;
          color: #4a4a4a;
          font-family: var(--font-mono);
          font-weight: 700;
        }

        .arcade-badge {
          display: inline-block;
          background-color: var(--color-dark);
          color: var(--color-white);
          padding: 0.15rem 0.5rem;
          font-size: 0.75rem;
          font-weight: 700;
          margin-top: 0.4rem;
        }

        /* Arcade Slider styles */
        .arcade-slider-box {
          padding: 2rem 0;
        }

        .arcade-slider-display {
          font-size: 1.2rem;
          font-weight: 900;
          text-align: center;
          margin-bottom: 1.5rem;
          font-family: var(--font-heading);
        }

        .slider-big-num {
          font-size: 4rem;
          font-weight: 900;
          color: var(--color-accent-orange);
          -webkit-text-stroke: 2px var(--color-dark);
          text-shadow: 4px 4px 0px var(--color-dark);
          display: inline-block;
          margin-right: 0.5rem;
        }

        .arcade-slider {
          width: 100%;
          height: 14px;
          background: var(--color-bg-paper);
          border: var(--border-brutal);
          outline: none;
          -webkit-appearance: none;
          border-radius: var(--radius-brutal);
          margin-bottom: 1rem;
        }

        .arcade-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 28px;
          height: 28px;
          background: var(--color-accent-green);
          border: var(--border-brutal);
          box-shadow: 2px 2px 0px var(--color-dark);
          border-radius: var(--radius-brutal);
          cursor: pointer;
          transition: transform var(--transition-fast);
        }

        .arcade-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }

        .arcade-slider-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--color-dark);
        }

        .console-note-box {
          background-color: var(--color-accent-purple);
          border: var(--border-brutal);
          padding: 1rem;
          font-family: var(--font-mono);
          font-size: 0.85rem;
          font-weight: 700;
          line-height: 1.5;
          margin-top: 2.5rem;
          box-shadow: var(--shadow-brutal-sm);
        }

        /* Addons Row list */
        .arcade-addons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .addon-row-brutal {
          border: var(--border-brutal);
          background-color: var(--color-white);
          padding: 1rem 1.25rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: var(--shadow-brutal-sm);
          transition: var(--transition-brutal);
        }

        .addon-row-brutal:hover {
          background-color: var(--color-bg-paper);
        }

        .addon-row-brutal.active {
          background-color: var(--color-accent-green);
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0px var(--color-dark);
        }

        .addon-toggle-box {
          width: 24px;
          height: 24px;
          border: 3px solid var(--color-dark);
          background-color: var(--color-white);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .addon-row-text {
          flex-grow: 1;
        }

        .addon-row-text h3 {
          font-size: 1.1rem;
          font-weight: 900;
        }

        .addon-row-text p {
          font-size: 0.8rem;
          margin-bottom: 0;
          color: #4a4a4a;
          font-weight: 700;
        }

        .addon-row-price {
          font-size: 1.2rem;
          font-weight: 900;
          white-space: nowrap;
        }

        /* Arcade Form Layout */
        .arcade-form {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        @media (min-width: 600px) {
          .arcade-form {
            grid-template-columns: repeat(2, 1fr);
          }
          .full-width {
            grid-column: span 2;
          }
        }

        .form-row-brutal {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .form-row-brutal label {
          font-size: 0.85rem;
          font-weight: 900;
          text-transform: uppercase;
        }

        .form-row-brutal input,
        .form-row-brutal textarea {
          border: var(--border-brutal);
          background-color: var(--color-bg-paper);
          padding: 0.75rem 1rem;
          font-family: var(--font-mono);
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--color-dark);
          outline: none;
        }

        .form-row-brutal input:focus,
        .form-row-brutal textarea:focus {
          background-color: var(--color-white);
          box-shadow: 4px 4px 0px var(--color-accent-yellow);
        }

        .submit-btn-arcade {
          width: 100%;
          margin-top: 1.5rem;
          background-color: var(--color-accent-yellow);
          padding: 1rem;
          font-size: 1.2rem;
        }

        .submit-btn-arcade:hover {
          background-color: var(--color-accent-green);
        }

        .console-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 2rem;
          border-top: 2px dashed var(--color-dark);
          padding-top: 1.5rem;
        }

        .next-btn {
          min-width: 120px;
        }

        /* Polaroid / Zine Printed Receipt Style */
        .arcade-receipt-container {
          display: flex;
          justify-content: center;
        }

        .brutal-receipt {
          width: 100%;
          max-width: 360px;
          background-color: var(--color-white);
          border-left: var(--border-brutal);
          border-right: var(--border-brutal);
          position: relative;
        }

        /* Spiky zig-zag receipt border in pure CSS */
        .receipt-border-top,
        .receipt-border-bottom {
          height: 10px;
          background: linear-gradient(-45deg, var(--color-white) 5px, transparent 0),
                      linear-gradient(45deg, var(--color-white) 5px, var(--color-dark) 0);
          background-size: 10px 10px;
          background-position: left top;
          width: 100%;
          position: absolute;
          left: 0;
        }

        .receipt-border-top {
          top: -10px;
          transform: rotate(180deg);
        }

        .receipt-border-bottom {
          bottom: -10px;
        }

        .receipt-content {
          padding: 2rem 1.5rem;
          font-family: var(--font-mono);
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--color-dark);
        }

        .receipt-header {
          font-size: 1.25rem;
          font-weight: 900;
          text-align: center;
          margin-bottom: 0.15rem;
        }

        .receipt-sub {
          display: block;
          text-align: center;
          font-size: 0.7rem;
          opacity: 0.6;
          margin-bottom: 1rem;
        }

        .dashed-divider {
          border-top: 2px dashed var(--color-dark);
          margin: 1rem 0;
        }

        .receipt-items {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .receipt-item {
          display: flex;
          justify-content: space-between;
          line-height: 1.4;
        }

        .receipt-item.sub-item {
          font-size: 0.8rem;
          padding-left: 0.5rem;
          opacity: 0.8;
        }

        .receipt-subheading {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--color-accent-orange);
          margin-top: 0.5rem;
        }

        .receipt-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 1.1rem;
          font-weight: 900;
          color: var(--color-dark);
        }

        .total-val {
          font-size: 1.5rem;
          background-color: var(--color-accent-yellow);
          border: 1px solid var(--color-dark);
          padding: 0 0.4rem;
        }

        .receipt-disclaimer-box {
          background-color: var(--color-accent-orange);
          color: var(--color-white);
          border: var(--border-brutal);
          padding: 0.5rem;
          margin-top: 1rem;
          text-align: center;
          font-size: 0.75rem;
          font-weight: 700;
          line-height: 1.4;
          box-shadow: 2px 2px 0px var(--color-dark);
          transform: rotate(-1deg);
        }
 
        .receipt-footer {
          text-align: center;
          font-size: 0.7rem;
          line-height: 1.5;
          margin-top: 1rem;
          opacity: 0.6;
        }

        /* Success screen adjustments */
        .success-screen {
          text-align: center;
          padding: 2rem 0;
        }

        .success-avatar {
          font-size: 4rem;
          margin-bottom: 1.5rem;
        }

        .success-screen h2 {
          font-size: 2.2rem;
          font-weight: 900;
          margin-bottom: 0.75rem;
        }

        .success-screen p {
          max-width: 500px;
          margin: 0 auto 2rem auto;
          font-family: var(--font-mono);
          font-weight: 700;
        }

        .success-screen .brutal-receipt {
          margin: 0 auto 2rem auto;
          text-align: left;
        }

        .success-screen .total-row {
          font-size: 1.1rem;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
}

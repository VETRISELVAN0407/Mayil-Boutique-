import { useEffect, useState } from 'react';
import * as virtualTryOnService from '../services/virtualTryOnService';

let availabilityPromise = null;

function loadAvailability() {
  if (!availabilityPromise) {
    availabilityPromise = virtualTryOnService.getAvailability().catch(() => {
      availabilityPromise = null; // try again next time; meanwhile treat as unavailable
      return false;
    });
  }
  return availabilityPromise;
}

/** null while loading, then true/false: whether Virtual Try-On is switched on and an AI engine is connected. */
export function useTryOnAvailable() {
  const [available, setAvailable] = useState(null);
  useEffect(() => {
    let active = true;
    loadAvailability().then((v) => active && setAvailable(v));
    return () => { active = false; };
  }, []);
  return available;
}

/** True when this product can be tried on (feature available AND the product enabled, ready and supported). */
export function useTryOnEligible(productId) {
  const available = useTryOnAvailable();
  const [eligible, setEligible] = useState(false);
  useEffect(() => {
    let active = true;
    setEligible(false);
    if (!available || !productId) return undefined;
    virtualTryOnService.getTryOnProduct(productId)
      .then(() => active && setEligible(true))
      .catch(() => active && setEligible(false));
    return () => { active = false; };
  }, [available, productId]);
  return eligible;
}

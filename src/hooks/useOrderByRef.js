import { useEffect, useState } from 'react';
import * as orderService from '../services/orderService';

/** Loads one of the signed-in customer's orders; `order` stays null when it is missing or not theirs. */
export function useOrderByRef(orderRef) {
  const [state, setState] = useState({ loading: true, order: null });

  useEffect(() => {
    let active = true;
    setState({ loading: true, order: null });
    orderService
      .getOrder(orderRef)
      .then((order) => active && setState({ loading: false, order }))
      .catch(() => active && setState({ loading: false, order: null }));
    return () => {
      active = false;
    };
  }, [orderRef]);

  return state;
}

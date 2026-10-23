type Listener = () => void;

const serverErrorListeners = new Set<Listener>();

/** Subscribe to "backend failed" events (5xx or server unreachable). */
export const onServerError = (listener: Listener) => {
  serverErrorListeners.add(listener);
  return () => {
    serverErrorListeners.delete(listener);
  };
};

export const emitServerError = () => {
  serverErrorListeners.forEach(listener => listener());
};

const recoveredListeners = new Set<Listener>();

/** Subscribe to "a call succeeded" events (the server is reachable again). */
export const onServerRecovered = (listener: Listener) => {
  recoveredListeners.add(listener);
  return () => {
    recoveredListeners.delete(listener);
  };
};

export const emitServerRecovered = () => {
  recoveredListeners.forEach(listener => listener());
};

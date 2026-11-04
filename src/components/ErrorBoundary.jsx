import React from 'react';

/** Last-resort guard so an unexpected render error shows a message instead of a blank page. */
export default class ErrorBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled render error', error, info?.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div style={{ padding: '4rem 1.5rem', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.75rem' }}>Something went wrong</h1>
        <p style={{ marginTop: '0.75rem' }}>Please refresh the page. If it keeps happening, try again a little later.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{ marginTop: '1.5rem', padding: '0.6rem 1.5rem', border: '1px solid currentColor' }}
        >
          Refresh
        </button>
      </div>
    );
  }
}

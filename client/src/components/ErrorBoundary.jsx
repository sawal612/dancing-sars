import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[EarthWatch ErrorBoundary caught error]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-red-50 text-red-900 border border-red-200 rounded-md m-4">
          <h2 className="text-base font-bold mb-2">Display Warning</h2>
          <p className="text-xs mb-3">{this.state.error?.message || 'A map rendering issue occurred.'}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700"
          >
            Reload View
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

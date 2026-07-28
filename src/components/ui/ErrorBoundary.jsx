import { Component } from "react";

import { logger } from "../../lib/logger.js";

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, details) {
    logger.error(`${this.props.name || "ui"} boundary`, error, details);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="hm-map-state hm-map-state--error" role="alert">
        <strong>Не удалось загрузить раздел</strong>
        <span>Проверьте подключение и повторите загрузку.</span>
        <button type="button" onClick={() => window.location.reload()}>
          Повторить
        </button>
      </div>
    );
  }
}

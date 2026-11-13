interface SlowLoaderProps {
  text?: string;
  inline?: boolean;
}

// Caricamento delle pagine con lo spinner e un messaggio a tema
const SlowLoader = ({ text = 'Caricamento protocolli in corso...', inline = false }: SlowLoaderProps) => (
  <div className={`${inline ? 'page-loader-inline' : 'page-loader'} slow-loader`} role="status" aria-live="polite">
    <div className="spinner-border text-danger" aria-hidden="true"></div>
    <p className="slow-loader-text">{text}</p>
  </div>
);

export default SlowLoader;

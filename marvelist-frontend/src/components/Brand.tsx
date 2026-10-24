import logo from '../assets/marvelist-logo.svg';

interface BrandProps {
  size?: 'sm' | 'md' | 'lg';
  showMark?: boolean;
}

// Logo MARVEList: icona (M rossa su ragnatela) + scritta in stile Marvel
const Brand = ({ size = 'md', showMark = true }: BrandProps) => (
  <span className={`brand brand-${size}`}>
    {showMark && <img src={logo} alt="" className="brand-mark" aria-hidden="true" />}
    <span className="brand-word" aria-label="MARVEList">
      <span className="brand-box" aria-hidden="true">MARVEL</span>
      <span className="brand-ist" aria-hidden="true">ist</span>
    </span>
  </span>
);

export default Brand;

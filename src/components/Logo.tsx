import { Link } from 'react-router-dom'

export function Logo() {
  return <Link to="/#inicio" className="logo" aria-label="C2T Tecnologia — início"><img className="logo-image" src="/brand/logo-primary.png" alt="C2T Tecnologia" /></Link>
}

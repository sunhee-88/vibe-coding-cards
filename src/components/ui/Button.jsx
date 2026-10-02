import { buttonClass } from './buttonClass.js'

export default function Button({ variant, size, block, className = '', ...props }) {
  return <button className={`${buttonClass({ variant, size, block })} ${className}`} {...props} />
}

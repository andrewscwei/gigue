type Result = {
  className: string
  subselector: string
  pseudo: string
}

export default function parseSelector(selector: string): Result {
  const m0 = /^\.([^ ~+>]+)(.*)$/.exec(selector)
  const mainSelector = m0?.[1]?.trim() ?? ''
  const subselector = m0?.[2]?.trim() ?? ''
  const m1 = /^(.*?[^\\])(:(.*))?$/.exec(mainSelector)
  const className = m1?.[1]?.trim() ?? ''
  const pseudo = m1?.[2]?.trim() ?? ''

  return { className, subselector, pseudo }
}

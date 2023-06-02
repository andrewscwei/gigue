type Result = {
  className?: string
  subselector?: string
}

export default function parseSelector(selector: string): Result {
  let className: string | undefined
  let subselector: string | undefined

  if (selector.startsWith('.')) {
    const matches = /^\.(.*) ?(.*)$/.exec(selector)
    className = matches?.[1]
    subselector = matches?.[2]
  }
  else if (selector.startsWith('[class~=')) {
    const matches = /^\[class~=('|")(.*)('|")\] ?(.*)$/.exec(selector)
    className = matches?.[2]
    subselector = matches?.[4]
  }

  return { className, subselector }
}

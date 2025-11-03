const fs = require('fs')
const path = require('path')

function walk(dir){
  let entries = fs.readdirSync(dir)
  let files = []
  for(const entry of entries){
    const p = path.join(dir, entry)
    const stat = fs.statSync(p)
    if(stat.isDirectory()) files = files.concat(walk(p))
    else files.push(p)
  }
  return files
}

const root = path.join(__dirname, '..')
const src = path.join(root, 'src')
const files = walk(src).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))
let modified = 0
for(const file of files){
  let s = fs.readFileSync(file, 'utf8')
  const ns = s.replace(/(["'])(@?[^"']+?)@(\d+\.\d+\.\d+)(["'])/g, '$1$2$4')
  if(ns !== s){
    fs.writeFileSync(file, ns)
    modified++
    console.log('fixed:', file)
  }
}
console.log('done, modified=', modified)

import React from 'react'
import classNames from 'classnames'
import { Link } from '../'

const NestedChapterList = props => {
  const { current, items } = props
  const depth = props.depth || 0
  const items_ = items.filter(a => a.depth === depth && a.inTOC)

  return (
    <ol>
      {items_.map((item, i) => (
        <li key={i}>
          <Link
            href={item.absoluteURL}
            className={classNames(`indent--${depth + 1}`, {
              'chapter--current': current === item.id,
            })}
          >
            {item.title || `Chapter ${depth}.${i}`}
          </Link>
          {item.children.length > 0 && (
            <NestedChapterList
              current={current}
              items={item.children}
              depth={depth + 1}
            />
          )}
        </li>
      ))}
    </ol>
  )
}

const SidebarChapters = props => (
  <nav
    className={classNames('controls__sidebar', 'controls__sidebar__chapters', {
      'controls__sidebar__chapters--open': props.showSidebar === 'chapters',
    })}
  >
    <NestedChapterList
      current={(props.spine[props.currentSpineItemIndex || 0] || {}).id}
      items={[...props.spine]}
    />
  </nav>
)

export default SidebarChapters

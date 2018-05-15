import React from 'react'
import classNames from 'classnames'

const SidebarDownloads = props => (
    <nav
        className={classNames(
            'controls__sidebar',
            'controls__sidebar__downloads',
            {'controls__sidebar__downloads--open': props.showSidebar === 'downloads'}
        )}
    >
        <ul>
            {props.downloads.map((a, i) => (
                <li key={i}>
                    <a href={a.url} download>{a.label}</a>
                </li>
            ))}
        </ul>
    </nav>
)

export default SidebarDownloads

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { LogoutOutlined, MailOutlined, MenuOutlined } from '@ant-design/icons'
import { Affix, Dropdown, Menu, Badge, Avatar } from 'antd'
import Button from 'antd/es/button'
import { ClickParam } from 'antd/lib/menu'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link, useLocation } from 'react-router-dom'
import { animateScroll as scroll } from 'react-scroll'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { selectIsAdmin } from 'store/user/usersSelector'
import styles from './styles/Header.scss'

const LOGOUT_URL = '/user/logout/'
const DEFAULT_AVATAR = '/static/cwcommon/avatar.png'

interface MyProps {
  menuItems?: JSX.Element
  accountMenuItems?: JSX.Element | JSX.Element[]
  menuClick: (x: ClickParam) => void
  children?: JSX.Element
  unreadMessages?: boolean
  alwaysShowMessages?: boolean
  avatarLabel?: string
  avatar?: string
}

const Header = ({
  menuItems,
  accountMenuItems,
  menuClick,
  children,
  unreadMessages = false,
  alwaysShowMessages = false,
  avatarLabel,
  avatar = DEFAULT_AVATAR,
}: MyProps) => {
  const dispatch = useReduxDispatch()
  const location = useLocation()
  const isAdmin = useSelector(selectIsAdmin)

  // Programatically style Messages menu item active state; it isn't pretty but fixes long standing styling bug
  useEffect(() => {
    const menuItems = document.querySelectorAll('[role="menuitem"]')
    if (location.pathname === '/message') {
      menuItems.forEach(menuItem => {
        if (menuItem.innerHTML === 'Messages') {
          menuItem.classList.remove('ant-menu-item-selected')
          menuItem.classList.add('ant-menu-item-selected')
        }
      })
    } else {
      menuItems.forEach(menuItem => {
        if (menuItem.innerHTML === 'Messages') {
          menuItem.classList.remove('ant-menu-item-selected')
        }
      })
    }
    return () => {
      if (location.pathname !== '/message') {
        menuItems.forEach(menuItem => {
          if (menuItem.innerHTML === 'Messages') {
            menuItem.classList.remove('ant-menu-item-selected')
          }
        })
      }
    }
  }, [location.pathname])

  const handleMenuClick = (menuItem: ClickParam) => {
    if (menuItem.key === 'logout') {
      window.location.href = LOGOUT_URL
    } else {
      menuClick(menuItem)
    }
  }

  const accountMenu = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key="message" className={alwaysShowMessages ? '' : 'message-menu-item'}>
        <MailOutlined />
        Messages
        {unreadMessages && <Badge>Hi!</Badge>}
      </Menu.Item>
      {accountMenuItems}
      <Menu.Item key="logout">
        <LogoutOutlined />
        Logout
      </Menu.Item>
    </Menu>
  )

  // FIXME: why doesn't this work!
  const handleLogoClick = () => {
    if (location.pathname === '/') {
      scroll.scrollToTop()
    }
  }

  return (
    <Affix offsetTop={0}>
      <header className={styles.header}>
        <div className='d-flex aline-item-center'>
          {!isAdmin && (
            <Button
              className="hamburger"
              type="link"
              size="small"
              onClick={() => dispatch(showModal({ modal: MODALS.HAMBURGER_MENU, props: {} }))}
            >
              <MenuOutlined />
            </Button>
          )}
          <div className="logo" onClick={handleLogoClick} onKeyDown={handleLogoClick} role="button" tabIndex={0}>
            <Link to="/">
              <img src="/static/cwcommon/common_app.png" alt="Collegewise" />
            </Link>
          </div>
        </div>
        <div className='d-flex aline-item-center'>
          {children} {/* Renders admin main navbar & Parent-StudentSelect */}
          <div className="children-container">
            <Menu mode="horizontal" onClick={menuClick}>
              {menuItems}
            </Menu>
          </div>
          {avatarLabel && <label className="avatar-label">{avatarLabel}</label>}
          <div className="account-menu">
            <Dropdown
              overlay={accountMenu}
              trigger={['click']}
              placement="bottomCenter"
              overlayClassName="account-menu-dropdown"
            >
              <Avatar src={avatar || DEFAULT_AVATAR} size="large" />
            </Dropdown>
          </div>
        </div>

      </header>
    </Affix>
  )
}

export default Header

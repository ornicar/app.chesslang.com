import * as React from 'react'
import { Link } from 'react-router-dom'
import { Layout } from 'antd'

import './not-found.less'
import { Footer } from '../footer'
import { Header } from '../header'

export function NotFound() {
  return (
    <Layout className="page not-found">
      <Header />
      <Layout className="content">
        <div className="wrapper">
          <h1 className="code">404</h1>
          <h1 className="message">
            We couldn't find the page you were looking for
          </h1>
          <h3>
            <Link to="/">Go to Home</Link>
          </h3>
        </div>
      </Layout>
      <Footer />
    </Layout>
  )
}

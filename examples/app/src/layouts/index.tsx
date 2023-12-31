import React from "react";
import { useLocation } from "react-router-dom";
import { Page, Content, Header } from "@alita/flow";
import { useKeepOutlets } from "@malitajs/keepalive";
import "./index.css";

const Layout = () => {
  const { pathname } = useLocation()
  const element = useKeepOutlets()

  return (
    <Page>
      <Header className='malita-layout'>当前路由: {pathname}</Header>
      <Content>
        {element}
      </Content>
    </Page>
  )
}

export default Layout
import React, { useState, useContext } from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route, useLocation, Link } from "react-router-dom";
import { Page, Content, Header } from "@alita/flow";
import KeepAliveLayout, { useKeepOutlets, KeepAliveContext } from '@casen001/keepalive';
// import KeepAliveLayout, { useKeepOutlets, KeepAliveContext } from '@malitajs/keepalive';

import Layout from './layouts/index';
import Hello from './pages/home';
import Users from './pages/users';

const Me = () => {
  return (
    <>
      <p>Me</p>
      <Link to="/">go Home</Link>
    </>
  )
}

const App = () => {
  return (
    <KeepAliveLayout keepalive={[/./]}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route path="/" element={<Hello />} />
            <Route path="/users" element={<Users />} />
            <Route path="/me" element={<Me />} />
          </Route>
        </Routes>
      </HashRouter>
    </KeepAliveLayout>
  )
}

const root = ReactDOM.createRoot(document.getElementById('malita'))
root.render(React.createElement(App))
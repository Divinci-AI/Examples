import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider, useAuth } from "./globals/auth";
import { useDivinciChat } from "./globals/divinci";

import Header from "./components/Header";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Example from "./pages/Example";
import Protected from "./pages/Protected";

function App(){
  return (
    <AuthProvider>
      <AppWithUser />
    </AuthProvider>
  );
}

function AppWithUser(){
  const { user } = useAuth();

  useEffect(()=>{
    console.log("User changed:", user);
    console.log(`Should ${user ? "login to" : "logout of"} the divinci chat`);
  }, [user]);
  useDivinciChat();

  return (
    <BrowserRouter>
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/example" element={<Example />} />
          <Route path="/protected" element={<Protected />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;

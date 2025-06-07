import React, { useState } from "react";
import theme from "theme";
import {
  Theme,
  Text,
  Input,
  Box,
  Button,
  Section,
  Select,
} from "@quarkly/widgets";
import { Helmet } from "react-helmet";
import { GlobalQuarklyPageStyles } from "global-page-styles";
import { getDatabase, ref as dbRef, push, set } from "firebase/database"; // Firebase database imports
import { NavBar } from "../utils/navbar";
import Footer from "../utils/footer";
// Firebase configuration is initialized elsewhere in firebaseConfig.js

// Function to add a new user to the database
const addUserToDatabase = async (email, password, role) => {
  const db = getDatabase();
  const usersRef = dbRef(db, "vamsi/users");
  const newUserRef = push(usersRef);
  await set(newUserRef, {
    email,
    password,
    role,
  });
  alert("User added successfully");
};

export default () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("manager"); // Default role is set to manager

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please fill in both email and password");
      return;
    }
    addUserToDatabase(email, password, role); // Call the function to add user
    setEmail("");
    setPassword("");
    setRole("manager");
  };

  return (
    <Theme theme={theme}>
      <GlobalQuarklyPageStyles pageUrl={"sudo-add-users"} />
      <Helmet>
        <title>Add New User</title>
        <link
          rel={"shortcut icon"}
          href={"https://live.staticflickr.com/65535/54572815698_9a48e198df_b.jpg"}
          type={"image/x-icon"}
        />
      </Helmet>

      <NavBar role={sessionStorage.getItem("role")} current={"Add Users"} />

      <Section padding="90px 0 100px 0" quarkly-title="Add-User">
        <Box
          display="flex"
          align-items="center"
          justify-content="center"
          position="relative"
        >
          <Text
            margin="0px 0px 20px 0px"
            text-align="center"
            font="normal 500 56px/1.2 --fontFamily-serifGeorgia"
            color="--dark"
            sm-margin="0px 0px 30px 0px"
          >
            Add New User
          </Text>
        </Box>

        <Box min-width="100px" min-height="100px" padding="15px 0px 15px 0px">
          <Text margin="15px 0px 15px 0px">Email</Text>
          <Input
            display="block"
            placeholder-color="LightGray"
            background="white"
            border-color="--color-darkL2"
            border-radius="7.5px"
            width="50%"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Text margin="15px 0px 15px 0px">Password</Text>
          <Input
            type="password"
            display="block"
            placeholder-color="LightGray"
            background="white"
            border-color="--color-darkL2"
            border-radius="7.5px"
            width="50%"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Text margin="15px 0px 15px 0px">Role</Text>
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            background="white"
            width="50%"
            padding="5px"
            border-radius="7.5px"
          >
            <option value="manager">Manager</option>
            <option value="sudo">Sudo</option>
          </Select>
          <br />
          <Button
            onClick={handleSubmit}
            margin="40px 0"
            background="#cb7731"
            color="white"
            padding="10px 20px"
            border-radius="7.5px"
          >
            Add User
          </Button>
        </Box>
      </Section>
      {/* <Footer /> */}
    </Theme>
  );
};

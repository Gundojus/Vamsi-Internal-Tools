import React from "react";
import { HashRouter as Router, Route, Switch, Redirect } from "react-router-dom";
import Login from "pages/utils/login";
import Orders from "pages/orders/ordersManagers";
import OrdersAdd from "pages/orders/ordersAdd";
import OrdersEdit from "pages/orders/ordersEdit";
import OrdersView from "pages/orders/ordersView"; // Public access for customers to view orders
import UsersAdd from "pages/sudo/sudoAddUser"; // Sudo-only route
import Page404 from "pages/utils/page404";
import CalendarPage from "pages/calendar/calendar";
import AddCustomer from "pages/customers/AddCustomer";
import ViewCustomers from "pages/customers/ViewCustomers";
import EditCustomer from "pages/customers/EditCustomer";
// Private route for authenticated users (manager or sudo)
const PrivateRoute = ({ component: Component, ...rest }) => {
  const role = sessionStorage.getItem("role");
  return (
    <Route
      {...rest}
      render={(props) =>
        role ? (
          <Component {...props} />
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
};

// Sudo-only route
const SudoRoute = ({ component: Component, ...rest }) => {
  const role = sessionStorage.getItem("role");
  return (
    <Route
      {...rest}
      render={(props) =>
        role === "sudo" ? (
          <Component {...props} />
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
};

export default function App() {
  return (
    <Router>
      <Switch>
        {/* Public Routes */}
        <Route exact path="/login" component={Login} />
        <Route exact path="/orders/view" component={OrdersView} /> {/* Publicly accessible */}
        
        {/* Private Routes for Authenticated Users */}
        <PrivateRoute exact path="/orders" component={Orders} />
        <PrivateRoute exact path="/orders/add" component={OrdersAdd} />
        <PrivateRoute exact path="/orders/edit" component={OrdersEdit} />
        <PrivateRoute exact path="/calendar" component={CalendarPage} />
        <PrivateRoute exact path="/customers/view" component={ViewCustomers} />
        <PrivateRoute exact path="/customers/add" component={AddCustomer} />
        <PrivateRoute exact path="/customers/edit" component={EditCustomer} />

        {/* Sudo Route */}
        <SudoRoute exact path="/sudo/users/add" component={UsersAdd} />

        {/* Redirect to login if no match */}
        <Route exact path="/" component={Login} />
        <Route component={Page404} />
      </Switch>
    </Router>
  );
}

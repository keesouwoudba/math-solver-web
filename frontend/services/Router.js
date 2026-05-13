const $ = function (args) {
  return document.querySelector(args);
};
const $$ = function (args) {
  return document.querySelectorAll(args);
};
HTMLElement.prototype.on = function (a, b, c) {
  return this.addEventListener(a, b, c);
};
HTMLElement.prototype.off = function (a, b) {
  return this.removeEventListener(a, b);
};
HTMLElement.prototype.$ = function (s) {
  return this.querySelector(s);
};
HTMLElement.prototype.$$ = function (s) {
  return this.querySelectorAll(s);
};
//returns nodelist, thats why do [...el.$("needed")] to make it array with methods like map filter.

const Router = {
  init: () => {
    console.log("Router: Router initialized");
    $$("a.navlink").forEach((a) => {
      a.on("click", (event) => {
        event.preventDefault();
        console.log("a.navlink clicked in listener");
        const url = a.getAttribute("href");
        Router.go(url);
      });
    });
    //event handler for URL changes
    window.addEventListener("popstate", (event) => {
      console.log("Router: popstate event listener callback");
      if (event.state && event.state.route) {
        Router.go(event.state.route, false);
      }
    });
    //check the initial URL
    Router.go(location.pathname);
  },
  go: (route, addToHistory = true) => {
    console.log(
      `Router: Navigating to ${route}, addToHistory: ${addToHistory}`,
    );
    if (addToHistory) {
      //history api for navigation without page reload
      history.pushState({ route }, null, route);
      console.log("router was pushed to history");
    }
    let pageElement = null;
    switch (route) {
      case "/":
        console.log("Router: switch: /");
        pageElement = document.createElement("main-page");
        break;
      case "/solver":
        console.log("Router: switch: /solver");
        pageElement = document.createElement("solver-home-page");
        break;
      case "/solver/variables":
        console.log("Router: switch: /solver/variables");
        pageElement = document.createElement("solver-variables-page");
        break;
      default:
        console.log(`Router: switch: default for route ${route}`);
        pageElement = document.createElement("main-page");
    }
    if (pageElement) {
      console.log("Router: Page element exists, rendering page");
      const main = $("main");
      main.replaceChildren(pageElement);
      window.scrollX = 0;
      window.scrollY = 0;
      console.log("Router: page element adding finished");
    } else {
      console.error(`Router: No page found for route ${route}`);
    }
  },
};

export default Router;

const Router = {
  init: () => {
    console.log("Router: Router initialized");
    document.querySelectorAll("a.navlink").forEach((a) => {
      a.addEventListener("click", (event) => {
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
      case "/solver/results":
        console.log("Router: switch: /solver/results");
        pageElement = document.createElement("solver-equation-results-page");
        break;
      case "/solver/solutions":
        console.log("Router: switch: /solver/solutions");
        pageElement = document.createElement("solver-solutions-choice-page");
        break;
      default:
        console.log(`Router: switch: default for route ${route}`);
        pageElement = document.createElement("main-page");
    }
    if (pageElement) {
      console.log("Router: Page element exists, rendering page");
      const main = document.querySelector("main");
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

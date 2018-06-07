//setup routes to start w/ the `#` symbol
m.route.mode = "hash";

//define a route
m.route(document.getElementById("container"), "/files/0", {
    "/files/:page": filelist,
    "/account": account
});

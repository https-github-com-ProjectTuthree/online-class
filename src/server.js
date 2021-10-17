import express from "express";
import http from "http";
import SocketIO from "socket.io";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

wsServer.on("connection", (socket) => {
    socket.on("join_room", (roomInfo) => {
        socket.join(roomInfo);
        socket.to(roomInfo).emit("welcome");
    });
    socket.on("offer", (offer, roomInfo) => {
        socket.to(roomInfo).emit("offer", offer);
    });
    socket.on("answer", (answer, roomInfo) => {
        socket.to(roomInfo).emit("answer", answer);
    });
    socket.on("ice", (ice, roomInfo) => {
        socket.to(roomInfo).emit("ice", ice);
    });
});

const handleListen = () => console.log(`Listening on http://localhost:3000`);
httpServer.listen(3000, handleListen);
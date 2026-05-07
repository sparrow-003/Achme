//     const db = require("../config/database");
//     const { Server } = require("socket.io");

//     let onlineUsers = {};

//     function initSocket(server) {
//     const io = new Server(server, {
//         cors: { origin: "*" }
//     });

//     io.on("connection", socket => {
//         console.log("User connected:", socket.id);

//         socket.on("join", userId => {
//         onlineUsers[userId] = socket.id;
//         io.emit("online_users", Object.keys(onlineUsers));
//         });

//         socket.on("send_message", data => {
//         const sql = `
//             INSERT INTO messages (sender_id, receiver_id, message, type)
//             VALUES (?,?,?,?)
//         `;

//         db.query(sql, [
//         data.senderId,
//         data.receiverId,
//         data.text,  
//         "text"
//         ], (err, result) => {
//             if (!err) {
//             io.emit("receive_message", {
//                 ...data,
//                 id: result.insertId
//             });
//             }
//         });
//         });

//         socket.on("send_message", data => {
//   db.query(
//     "INSERT INTO messages (sender_id, receiver_id, message, type) VALUES (?,?,?,?)",
//     [data.senderId, data.receiverId, data.text, data.type || "text"]
//   );

//   io.emit("receive_message", data);
// });

//     });
//     }

//     module.exports = { initSocket };

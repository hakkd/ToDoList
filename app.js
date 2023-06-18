import bodyparser from "body-parser";
import express from "express";
import mongoose from "mongoose";
import _ from "lodash";
import {config} from "./config.js";

const app = express();

app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({extended: true}));
app.use(express.static("public"));

//mongoose.connect("mongodb://localhost:27017/todolistDB");
mongoose.connect(config.db_url);

const itemSchema = {
    name: String
};

const Item = mongoose.model("Item", itemSchema); 

const item1 = new Item({
    name: "Welcome to your to do list!"
});

const item2 = new Item({
    name: "Click + to add a new item"
});

const item3 = new Item({
    name: "<-- Click to delete item"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

app.get('/', function(req, res) {
    List.find().then((lists) => {
        if (lists.length === 0) {
            const defaultList = new List({
                name: "Today",
                items: defaultItems,
            });
            defaultList.save();
            res.redirect("/");
        } else {
            res.render("home", { lists: lists });
        }
    })
});

app.get("/:listName", function(req, res) {
    const listName = _.capitalize(req.params.listName);

    List.findOne({name: listName})
        .then((foundList) => {
            if (!foundList) {
                console.log("List not found");
                res.redirect("/");
            } else {
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
            }}).catch((err) => {console.log(err);});
});

app.get("/about", function(req, res) {
    res.render("about");
});

app.post("/", function(req, res) {
    const newListName = _.capitalize(req.body.newList);

    List.findOne({name: newListName}).then((foundList) => {
        if(!foundList) {
            let list = new List({
                name: newListName,
                items: defaultItems
                });
            list.save();
        } else {
            console.log("A list with that name already exists.");
        }
        }).catch((err) => {console.error(err)});

    res.redirect("/");
})

app.post("/:listName", function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    let item = new Item({
        name: itemName
    });
    List.findOne({name: listName}).then((foundList) => {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
    }).catch((err) => {console.error(err)}
    );
    
});

app.post("/delete", async function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        await Item.findByIdAndRemove(checkedItemId)
            .then(()=>console.log(`Deleted ${checkedItemId} Successfully`))
            .catch((err) => console.log("Deletion Error: " + err));
        res.redirect("/" + "Today");
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}
            ).then((checkedItemId) => {
                    console.log(`Deleted ${checkedItemId} Successfully`);
                }).catch((err) => console.log("Deletion Error: " + err));
        res.redirect("/" + listName);
    }
});

app.post("/delete-list", async function(req, res) {
    const toDelete = req.body.delete;

    List.findByIdAndRemove(toDelete).then(()=>console.log(`Deleted ${toDelete} Successfully`)).catch(err => console.log(err));
    res.redirect("/");
})

app.listen(3000, function() {
    console.log("server running on port 3000");
});
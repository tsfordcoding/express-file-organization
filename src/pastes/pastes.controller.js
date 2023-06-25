const pastes = require("../data/pastes-data");

const list = (req, res) => {
    res.json({ data: pastes });
};

let lastPasteId = pastes.reduce((maxId, paste) => Math.max(maxId, paste.id), 0);

const bodyDataHas = (propertyName) => {
    return (req, res, next) => {
        const { data = {} } = req.body;
        if(data[propertyName]) {
            return next();
        }
        next({
            status: 400,
            message: `Must include a ${propertyName} property.`,
        });
    }
}

const exposurePropertyIsValid = (req, res, next) => {
    const { data: { exposure } = {} } = req.body;
    const validExposure = ["public", "private"];
    if(validExposure.includes(exposure)) {
        return next();
    }
    next({
        status: 400,
        message: `Value of the 'exposure' property must be ${validExposure.join(" or ")}. Received: ${exposure}`,
    });
}

const syntaxPropertyIsValid = (req, res, next) => {
    const { data: { syntax } = {} } = req.body;
    const validSyntax = ["None", "Javascript", "Python", "Ruby", "Perl", "C", "Scheme"];
    if(validSyntax.includes(syntax)) {
        return next();
    }
    next({
        status: 400,
        message: `Value of the syntax property must be one of ${validSyntax.join(", ")}. Received: ${syntax}`,
    })
}

const expirationPropertyIsValid = (req, res, next) => {
    const { data: { expiration } = {} } = req.body;
    if(expiration <= 0 || !Number.isInteger(expiration)) {
        return next({
            status: 400,
            message: `Expiration requires a valid number.`
        });
    }
    next();
}

const create = (req, res) => {
    const { data: { name, syntax, exposure, expiration, text, user_id } = {} } = req.body;
    const newPaste = {
        id: ++lastPasteId,
        name,
        syntax,
        exposure,
        expiration,
        text,
        user_id,
    };
    pastes.push(newPaste);
    res.status(201).json({ data: newPaste });
}

const pasteExists = (req, res, next) => {
    const { pasteId } = req.params;
    const foundPaste = pastes.find((paste) => paste.id === Number(pasteId));
    
    if(foundPaste) {
        return next();
    }
    next({
        status: 404,
        message: `Paste id not found: ${pasteId}`,
    });
}

const read = (req, res) => {
    const { pasteId } = req.params;
    const foundPaste = pastes.find((paste) => paste.id === Number(pasteId));
    res.json({ data: foundPaste });
}

const update = (req, res) => {
    const { pasteId } = req.params;
    const foundPaste = pastes.find((paste) => paste.id === Number(pasteId));
    const { data: { name, syntax, expiration, exposure, text } = {} } = req.body;

    foundPaste.name = name;
    foundPaste.syntax = syntax;
    foundPaste.expiration = expiration;
    foundPaste.exposure = exposure;
    foundPaste.text = text;
    
    res.json({ data: foundPaste });
}

const destroy = (req, res) => {
    const { pasteId } = req.params;
    const index = pastes.findIndex((paste) => paste.id === Number(pasteId));
    const deletePastes = pastes.splice(index, 1);
    res.sendStatus(204);
}

module.exports = {
    create: [
        bodyDataHas("name"),
        bodyDataHas("syntax"),
        bodyDataHas("exposure"),
        bodyDataHas("expiration"),
        bodyDataHas("text"),
        bodyDataHas("user_id"),
        exposurePropertyIsValid,
        syntaxPropertyIsValid,
        expirationPropertyIsValid,
        create
    ],
    list,
    read: [pasteExists, read],
    update: [
        pasteExists,
        bodyDataHas("name"),
        bodyDataHas("syntax"),
        bodyDataHas("exposure"),
        bodyDataHas("expiration"),
        bodyDataHas("text"),
        exposurePropertyIsValid,
        syntaxPropertyIsValid,
        expirationPropertyIsValid,
        update
    ],
    delete: [pasteExists, destroy],
};
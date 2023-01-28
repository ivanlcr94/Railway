
process.on('message', msg => {
    
    const sum = () => {
    let sum = 0;
    for (let i = 0; i < 5e9; i++) {
        sum += 1;
    }
    return sum;}

    let result = sum()

    process.send(`${result}`)
    process.exit()
 })
 
 process.send('listo')
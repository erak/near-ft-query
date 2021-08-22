import {Command, flags} from '@oclif/command'
import { getTransactions } from '../near'

const filename = "token_data.json"

// block hash of query start (oldest block)
let cache = {
  created: new Date(),
  updated: new Date(),
  contract: 'hype.tkn.near',
  blockhash: '83vrZzXWPYc14a7ZzdywfW9HevNy1TWTT1hxKLu2rDZU', // #45791790
  balances: []
}

export default class Init extends Command {
  static description = 'describe the command here'

  static examples = [
    `$ near-ft-query init
hello world from ./src/hello.ts!
`,
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({char: 'n', description: 'name to print'}),
    // flag with no value (-f, --force)
    force: flags.boolean({char: 'f'}),
  }

  static args = [{name: 'file'}]

  async run() {
    const {args, flags} = this.parse(Init)

    this.log('Initializing cache file', filename, '...')

    let out = JSON.stringify(cache)
    this.log(JSON.parse(out))

    // Block hash of query end (newest block). Not included in the query.
    const last_blockhash = "GDsnR2qc6geFWf3Ktmofa6LiX2gGPxBweXUfqFVkXeSv" // #45791792

    // FIND Blocks #45791791
    getTransactions(cache.blockhash, last_blockhash, cache.contract)

    // const name = flags.name ?? 'world'
    // this.log(`hello ${name} from ./src/commands/hello.ts`)
    // if (args.file && flags.force) {
    //   this.log(`you input --force and --file: ${args.file}`)
    // }
  }
}

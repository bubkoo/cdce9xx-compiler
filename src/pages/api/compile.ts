import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import formidable, { File } from 'formidable'
import { NextApiRequest, NextApiResponse } from 'next'
import { put, head, list, del } from "@vercel/blob"

export const config = {
  api: {
    bodyParser: false, // Disallow body parsing, consume as stream
  },
}

function isHexFile(file: File): file is File {
  return file.filepath !== undefined && path.extname(file.filepath) === '.hex'
}

async function uploadFile(req: NextApiRequest) {
  const form = formidable({ multiples: false, keepExtensions: true })
  return new Promise((resolve, reject) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        reject(err)
      }

      // console.log(fields, files)
      const hex = files.hex && files.hex[0]
      const name = Array.isArray(fields.name) ? fields.name[0] : fields.name

      if (!name) {
        reject('hex name is required')
      }

      if (hex && isHexFile(hex)) {
        const result = await put(`${name}.hex`, fs.createReadStream(hex.filepath), { access: 'public' })
        resolve(result)
      } else {
        reject()
      }
    })
  })
}

async function listFiles() {
  const { blobs } = await list()
  console.log(blobs)
  // await deleteAllFiles();
}

async function deleteAllFiles() {
  const { blobs } = await list()
  for (const blob of blobs) {
    await del(blob.url)
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      deleteAllFiles()
      uploadFile(req)
      listFiles()
      // const form = formidable({ multiples: false,keepExtensions:true })
      // const fileContent: string = await(new Promise((resolve, reject) => {
      //   form.parse(req, (err, _fields, files) => {
      //     console.log(_fields)
      //     const hex = files.hex&&files.hex[0]
      //     if(hex&&isHexFile(hex)){
      //         console.log(hex);
      //         const hexPath = hex.filepath
      //         const cwd = path.dirname(hexPath)
      //         const binPath = path.join(cwd, `cdce.bin`)
      //         const codePath = path.join(cwd, `cdce.h`)
      //         // const fileContentBuffer = fs.readFileSync(hex.filepath)
      //         // const fileContentReadable = fileContentBuffer.toString('utf8')
      //         execSync(`${objcopyCmd} -I ihex -O binary ${hex.newFilename} cdce.bin`, {cwd})
      //         execSync(`xxd -i -a cdce.bin > cdce.h`, {cwd})
      //         const code= fs.readFileSync(codePath,{encoding:'utf-8'})
      //         resolve(code)
      //     }
      //     reject()
      //   })
      // }))

      // // Do whatever you'd like with the file since it's already in text
      // console.log(fileContent)

      res.status(200).send({ message: 'ok' })
    } catch (err) {
      res.status(400).send({ message: 'Bad Request' })
    }

  } else {
    res.status(405).json({ message: 'Method Not Allowed' })
  }
}

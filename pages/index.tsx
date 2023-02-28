import Head from 'next/head'
import React, { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import axios from 'axios';

function App() {

  const [repoUrl, setRepoUrl] = useState('');
  const [repoFiles, setRepoFiles] = useState<any[]>([]);
  const [log, setLog] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const fileListRef = useRef<HTMLUListElement>(null);

  // Fetch folder data
  const fetchFolderData = async (folderUrl: string) => {
    // get folder data
    const response = await axios.get(folderUrl);
    return response.data;
  };

  // Download file content
  const downloadFileContent = async (file: { download_url: string; }) => {
    // get file content as blob
    const response = await axios.get(file.download_url, {
      responseType: "blob",
    });
    return response.data;
  };

  // Download folder contents
  const downloadFolderContents = async (folder: any, zip: JSZip) => {
    for (const item of folder) {
      if (item.type === "file") {
        // for file, download content and add to zip
        setLog(`Queuing download of ${item.name}`);
        const fileContent = await downloadFileContent(item);
        setRepoFiles((prev) => [...prev, item]);
        zip.file(item.name, fileContent);
      } else if (item.type === "dir") {
        // for folder, fetch folder contents and call downloadFolderContents recursively
        const subFolder = await fetchFolderData(item.url);
        const subFolderZip = zip.folder(item.name);
        await downloadFolderContents(subFolder, subFolderZip as JSZip);
      }
    }
  };

  // Fetch repo contents
  const downloadRepositoryContents = async (folderUrl: string) => {
    try {
      const folderData = await fetchFolderData(folderUrl);
      const zip = new JSZip();
      await downloadFolderContents(folderData, zip);
      return zip;
    } catch (error) {
      console.error(`Error: ${error}`);
    }
  };

  // Download repo contents
  const downloadFolder = async () => {
    setLog('');
    setRepoFiles([]);

    // check if url is valid
    if (!repoUrl.includes('github.com')) {
      setLog('Invalid URL');
      return;
    }

    // extract user, repo, and dir from url
    const user = repoUrl.split('/')[3];
    const repo = repoUrl.split('/')[4];
    const dir = repoUrl.split('/').slice(7).join('/');
    console.log(user, repo, dir);

    setLog('Fetching repo contents...');
    const zip = await downloadRepositoryContents(`https://api.github.com/repos/${user}/${repo}/contents/${dir}`);

    if (!zip) {
      setLog('Rate limit exceeded. Try again in a few minutes.');
      return;
    }

    setLog('Zipping...');
    // generate zip file
    const content = await zip.generateAsync({ type: 'blob' });
    // download zip file
    FileSaver.saveAs(content, `${dir ? dir.replace(/\/|%20/g, '-') : repo}.zip`);

    // get list of files so we can show length
    const fileList = zip.file(/.*/);

    setLog(`Downloaded Total ${fileList.length} files\nUser: ${user}\nRepository: ${repoUrl}\nFolder: ${dir}\nSize: ${content.size / 1024 / 1024} MB`);
  };

  // Scroll to bottom of file list
  useEffect(() => {
    if (fileListRef.current) {
      fileListRef.current.scrollTop = fileListRef.current.scrollHeight;
    }
  }, [repoFiles]);

  // Focus on input field
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <>
      <Head>
        {/* 




        Saurav Hathi 





        */}
        <title>GitHub Repository Downloader</title>
        {/* description */}
        <meta name="description"
          content="GitHub Repository Downloader is a convenient and user-friendly tool that allows you to easily download entire repositories or specific folders from GitHub as a ZIP file. Whether you're a developer looking to download code for offline use, or simply want to access files that are no longer available online, GitHub Repository Downloader makes it easy to get the files you need." />
        {/* keywords */}
        <meta name="keywords"
          content="github, repository, downloader, download, zip, file, files, folder, folders, code, offline, use, access, files, no longer available, online, tool, convenient, user-friendly, easy, get, files, need" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="App">
        <main>
          <h1 aria-label="Heading">GitHub Repository Downloader</h1>
          <p aria-label="Description">Download GitHub repositories and folders with ease using GitHub Repository Downloader.</p>
          <div className='input-box'>
            <span className="press-enter">Press Enter to start download</span>
            <input type="text"
              value={repoUrl}
              ref={inputRef}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="Enter GitHub repo URL"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  downloadFolder();
                }
              }} />
            <button
              onClick={downloadFolder}
              aria-label="Download folder">
              Download
            </button>
          </div>
          {log && <div className='output'>
            <pre className="log">{log}</pre>
          </div>}
          {repoFiles.length > 0 && <div className='output'>
            <ul className="files"
              ref={fileListRef}
              aria-label="Downloaded files">
              {repoFiles.map((file, index) => (
                <li key={index}>{file.name}</li>
              ))}
            </ul>
          </div>}
          <p style={{ textAlign: "left", marginBottom: 0 }}>
            GitHub Repository Downloader is currently <b>not compatible with Google Chrome</b>. We apologize for any inconvenience this may cause. In the meantime, we recommend using another browser such as <b style={{ color: "red" }}>Firefox or Edge</b> to access our tool and download repositories or folders from GitHub.
          </p>
          <footer aria-label="Footer">
            <a href="https://github.com/sauravhathi">
              Made ❤️ by Saurav Hathi
            </a>
          </footer>
        </main>
      </div>
    </>
  );
}

export default App;
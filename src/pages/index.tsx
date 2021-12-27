import { FiCalendar, FiUser } from 'react-icons/fi';
import { GetStaticProps } from 'next';
import { useState } from 'react';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import Head from 'next/head';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [pagination, setPagination] = useState<PostPagination>(postsPagination);

  async function handleLoadMorePosts(): Promise<void> {
    const nextPage = await fetch(postsPagination.next_page);

    nextPage.json().then(results => {
      const paginationResults = [...pagination.results];

      const newResults = paginationResults.concat(results.results);

      const newPagination = {
        next_page: results.next_page,
        results: newResults,
      };

      setPagination(newPagination);
    });
  }

  return (
    <>
      <Head>
        <link rel="shortcut icon" href="favicon.svg" type="image/x-icon" />
        <title>Posts | spacetraveling</title>
      </Head>
      <main className={commonStyles.container}>
        <div className={styles.posts}>
          {pagination.results.map(post => {
            return (
              <Link key={post.uid} href={`/post/${post.uid}`}>
                <a>
                  <h1>{post.data.title}</h1>
                  <p>{post.data.subtitle}</p>
                  <div className={commonStyles.infos}>
                    <FiCalendar />
                    <span>
                      {format(
                        new Date(post.first_publication_date),
                        'd MMM y',
                        {
                          locale: ptBR,
                        }
                      )}
                    </span>
                    <FiUser />
                    <span>{post.data.author}</span>
                  </div>
                </a>
              </Link>
            );
          })}
        </div>
        {pagination.next_page ? (
          <button
            className={styles.loadPostsButton}
            type="button"
            onClick={handleLoadMorePosts}
          >
            Carregar mais posts
          </button>
        ) : null}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );

  const nextPage = postsResponse.next_page;

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: nextPage,
        results: posts,
      },
    },
  };
};
